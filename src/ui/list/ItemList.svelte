<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import './rows.css';
  import type { Item } from '../../shared/types';
  import { getDepartment, OTHER_DEPARTMENT } from '../../shared/departments';
  import { formatQuantity } from '../../shared/quantity';
  import { activeItemsInOrder, list } from '../../state/groceryList.svelte';
  import { preferences } from '../../state/preferences.svelte';
  import { checkedItems, toggleItem } from '../../state/checking';
  import { revealIfRequested } from '../shared/reveal';
  import { openEditSheet } from '../sheet/editSheetState.svelte';
  import { arrange } from './arrangement';
  import { HeldArrangement } from './heldArrangement.svelte';
  import { RowDrag } from './rowDrag.svelte';
  import { SectionDrag } from './sectionDrag.svelte';
  import { appear, dragMoveDuration, moveDuration, reorder } from './transitions';
  import { fadeSwap } from './viewSwitch';
  import { swipeToDelete } from './swipeToDelete';
  import { deleteWithUndo } from '../shared/deleteWithUndo';
  import EmptyState from './EmptyState.svelte';

  let listElement: HTMLElement;
  /** Lags behind preferences.grouping while the view-switch animation runs. */
  let displayedGrouping = $state(preferences.grouping);
  let switchingView = false;

  const held = new HeldArrangement();
  const activeItems = $derived(activeItemsInOrder());
  const itemsById = $derived(new Map(activeItems.map((item) => [item.id, item])));
  const arrangement = $derived(held.sections ?? arrange(activeItems, displayedGrouping, list.departmentOrder));
  const sections = $derived(
    arrangement.map((section) => ({
      ...section,
      items: section.itemIds.map((id) => itemsById.get(id)).filter((item): item is Item => item !== undefined),
    })),
  );

  const rowDrag = new RowDrag(() => listElement, held, () => arrangement);
  const sectionDrag = new SectionDrag(() => listElement, held, () => arrangement);
  const reorderDuration = $derived(rowDrag.draggingItemId || sectionDrag.draggingDepartment ? dragMoveDuration : moveDuration);

  onMount(() => {
    const drags = [rowDrag.attach(), sectionDrag.attach()];
    return () => drags.forEach((drag) => drag.destroy());
  });

  $effect(() => {
    void list.items;
    void list.departmentOrder;
    untrack(() => held.listChanged());
  });

  $effect(() => {
    const wanted = preferences.grouping;
    untrack(() => {
      if (wanted !== displayedGrouping && !switchingView) switchView();
    });
  });

  async function switchView() {
    switchingView = true;
    const showWantedView = async () => {
      displayedGrouping = preferences.grouping;
      await tick();
    };
    if (activeItems.length) await fadeSwap(listElement, showWantedView);
    else await showWantedView();
    switchingView = false;
    // The user may have toggled again while the animation ran.
    if (preferences.grouping !== displayedGrouping) switchView();
  }
</script>

{#snippet rowContent(item: Item, checked: boolean)}
  <button class="ck" onclick={() => toggleItem(item.id)} aria-label={checked ? 'Võta tagasi' : 'Märgi ostetuks'}>
    <span class="o"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg></span>
  </button>
  <button class="nm" onclick={() => (checked ? toggleItem(item.id) : openEditSheet(item.id))}>
    <span class="t">{item.name}</span>
    {#if item.quantity}<span class="q">{formatQuantity(item.quantity)}</span>{/if}
  </button>
{/snippet}

<!-- The row <li> is repeated below because animate: only works on an element directly inside a keyed each block. -->
<main bind:this={listElement} class:folded={sectionDrag.folded} use:swipeToDelete={{ onDelete: deleteWithUndo }}>
  {#if list.loadStatus === 'ready'}
    {#if displayedGrouping === 'grouped'}
      {#each sections as section (section.id)}
        {@const department = getDepartment(section.kind === 'department' ? section.id : OTHER_DEPARTMENT)}
        <section
          class="grp"
          class:drag={sectionDrag.draggingDepartment === section.id}
          data-department={section.id}
          style:--c={department.color}
          animate:reorder={{ duration: reorderDuration }}
          transition:appear
        >
          <h2><i></i>{department.name}<span>{section.items.length}</span></h2>
          <ul class="card" data-section={section.id}>
            {#each section.items as item (item.id)}
              <li
                class="row"
                class:checked={checkedItems.has(item.id)}
                class:drag={rowDrag.draggingItemId === item.id}
                data-id={item.id}
                style:--c={getDepartment(item.department).color}
                use:revealIfRequested={item.id}
                animate:reorder={{ duration: reorderDuration }}
                transition:appear
              >
                {@render rowContent(item, checkedItems.has(item.id))}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {:else}
      <ul class="card" data-section="all">
        {#each sections[0].items as item (item.id)}
          <li
            class="row"
            class:checked={checkedItems.has(item.id)}
            class:drag={rowDrag.draggingItemId === item.id}
            data-id={item.id}
            style:--c={getDepartment(item.department).color}
            use:revealIfRequested={item.id}
            animate:reorder={{ duration: reorderDuration }}
            transition:appear
          >
            {@render rowContent(item, checkedItems.has(item.id))}
          </li>
        {/each}
      </ul>
    {/if}
    {#if !activeItems.length && !held.sections}
      <EmptyState />
    {/if}
  {/if}
</main>

<style>
  main {
    padding: 4px 12px 0;
  }
  main > .card {
    margin-top: 10px;
  }

  .row {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  .row:global(.hold) {
    transform: scale(0.985);
    transition: transform 0.35s var(--ease);
  }
  .row.drag {
    z-index: 6;
    border-radius: 16px;
    box-shadow: 0 14px 34px rgba(10, 20, 14, 0.22), 0 0 0 1px var(--line);
    transition: box-shadow 0.2s, border-radius 0.2s;
    will-change: transform;
  }
  .row.drag + .row,
  .row.drag ~ .row {
    box-shadow: inset 0 1px 0 var(--line);
  }

  .grp h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 18px 8px 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--mut);
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    cursor: grab;
    transition: opacity 0.3s;
  }
  .grp h2 i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
    flex: none;
  }
  .grp h2 span {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }
  .grp:global(.ghold) > h2 {
    opacity: 0.55;
  }

  .folded .grp .card {
    display: none;
  }
  .folded .grp {
    background: var(--card);
    border-radius: 14px;
    margin: 8px 0;
    box-shadow: var(--sh), inset 0 0 0 1px var(--line);
  }
  .folded .grp > h2 {
    margin: 0;
    padding: 0 16px;
    min-height: 52px;
    color: var(--ink);
    font-size: 15px;
  }
  .grp.drag {
    position: relative;
    z-index: 6;
    box-shadow: 0 14px 34px rgba(10, 20, 14, 0.22), 0 0 0 1px var(--line);
    will-change: transform;
  }
</style>
