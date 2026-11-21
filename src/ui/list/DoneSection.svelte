<script lang="ts">
  import './rows.css';
  import { getDepartment } from '../../shared/departments';
  import { formatQuantity } from '../../shared/quantity';
  import { doneItemsNewestFirst, list } from '../../state/groceryList.svelte';
  import { preferences, savePreferences } from '../../state/preferences.svelte';
  import { readdItem } from '../../state/adding';
  import { openEditSheet } from '../sheet/editSheetState.svelte';
  import { deleteWithUndo } from '../shared/deleteWithUndo';
  import { swipeToDelete } from './swipeToDelete';
  import { slideWhenPushed } from './slideWhenPushed';

  const doneItems = $derived(doneItemsNewestFirst());

  function toggleExpanded() {
    preferences.doneExpanded = !preferences.doneExpanded;
    savePreferences();
  }
</script>

<!-- Waits for the whole list like ItemList does, so the list doesn't render above it later and push it down. -->
{#if list.loadStatus === 'ready' && doneItems.length}
  <section class="done" class:open={preferences.doneExpanded} use:slideWhenPushed>
    <button class="toggle" onclick={toggleExpanded} aria-expanded={preferences.doneExpanded}>
      <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>Ostetud
      {#key doneItems.length}<span class="count">{doneItems.length}</span>{/key}
    </button>
    <div class="collapsible" inert={!preferences.doneExpanded}>
      <div>
        <ul class="card" use:swipeToDelete={{ onDelete: deleteWithUndo }}>
          {#each doneItems as item (item.id)}
            <li class="row bought" data-id={item.id} style:--c={getDepartment(item.department).color}>
              <button class="ck" onclick={() => readdItem(item.id)} aria-label="Lisa uuesti: {item.name}">
                <span class="ck2"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg></span>
              </button>
              <button class="nm" onclick={() => openEditSheet(item.id)}>
                <span class="t">{item.name}</span>
                {#if item.quantity}<span class="q">{formatQuantity(item.quantity)}</span>{/if}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
{/if}

<style>
  .done {
    margin-top: 22px;
    padding: 0 12px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    background: none;
    border: 0;
    padding: 0 8px;
    font-weight: 700;
    font-size: 15px;
    color: var(--mut);
    text-align: left;
  }
  .toggle svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    transition: transform 0.35s var(--ease);
  }
  .open .toggle svg {
    transform: rotate(90deg);
  }
  .count {
    background: var(--soft);
    border-radius: 999px;
    padding: 1px 9px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    animation: pop 0.45s var(--ease);
  }
  .collapsible {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.45s var(--ease);
  }
  .collapsible > div {
    overflow: hidden;
  }
  .open .collapsible {
    grid-template-rows: 1fr;
  }
  .card {
    margin-top: 6px;
    overflow: hidden;
  }
</style>
