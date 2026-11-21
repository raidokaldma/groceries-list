<script lang="ts">
  import { getDepartment } from '../../shared/departments';
  import { formatQuantity } from '../../shared/quantity';
  import { suggest, type Suggestion } from '../../shared/suggestions';
  import { activeItemsInOrder, list } from '../../state/groceryList.svelte';
  import { addItem } from '../../state/adding';
  import { revealWhenRendered } from '../shared/reveal';
  import { exposeHeight } from '../shared/viewport';

  let query = $state('');
  let focused = $state(false);
  let input: HTMLInputElement;
  let suggestionBar: HTMLElement;
  let dock: HTMLElement;

  const keysOnList = $derived(new Set(activeItemsInOrder().map((item) => item.key)));
  const { quantity, suggestions } = $derived(suggest(query, list.history, keysOnList));
  const typed = $derived(query.trim());

  $effect(() => {
    document.body.classList.toggle('adding', focused);
  });

  $effect(() => {
    void suggestions;
    if (suggestionBar) suggestionBar.scrollLeft = 0;
  });

  function add(picked?: Suggestion) {
    const id = addItem(query, picked);
    if (!id) return;
    revealWhenRendered(id);
    query = '';
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    add();
    input.focus();
  }

  /** The add button opens the dock, closes it while nothing is typed, and otherwise submits. */
  function useAddButton(event: MouseEvent) {
    if (!focused) {
      event.preventDefault();
      input.focus();
    } else if (!typed) {
      event.preventDefault();
      input.blur();
    }
  }

  /** Scrolling the list closes the dock. Only user scrolls count: adding an item scrolls the list to it. */
  function closeOnScroll(event: Event) {
    if (focused && !dock.contains(event.target as Node)) input.blur();
  }

  function clear() {
    query = '';
    input.focus();
  }

  /** Keeps the input focused, so the keyboard stays open while picking suggestions. */
  function keepFocus(event: PointerEvent) {
    if (document.activeElement === input) event.preventDefault();
  }
</script>

<svelte:window ontouchmove={closeOnScroll} onwheel={closeOnScroll} />

<div class="dock" class:active={focused} id="dock" bind:this={dock} use:exposeHeight={'--barh'}>
  <div class="suggestions" bind:this={suggestionBar} aria-label="Soovitused">
    {#each suggestions as suggestion, i (suggestion.key)}
      <button
        type="button"
        class="chip"
        class:on-list={suggestion.alreadyOnList}
        style:--c={getDepartment(suggestion.department).color}
        style:--i={i}
        onpointerdown={(event) => event.preventDefault()}
        onclick={() => add(suggestion)}
      >
        <i></i>{#if quantity}<b>{formatQuantity(quantity)}</b>{/if}{suggestion.name}
      </button>
    {:else}
      {#if typed}<span class="hint">Enter lisab <b>{typed}</b></span>{/if}
    {/each}
  </div>
  <form onsubmit={submit} autocomplete="off">
    <div class="field">
      <input
        bind:this={input}
        bind:value={query}
        onfocus={() => (focused = true)}
        onblur={() => (focused = false)}
        type="text"
        placeholder="Lisa toode…"
        aria-label="Lisa toode"
        enterkeyhint="enter"
        autocapitalize="sentences"
        autocorrect="off"
        spellcheck="false"
      />
      {#if query}
        <button type="button" class="clear" aria-label="Tühjenda" onpointerdown={keepFocus} onclick={clear}>
          <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" /></svg>
        </button>
      {/if}
    </div>
    <button
      class="add"
      type="submit"
      class:closes={focused && !typed}
      aria-label={!focused ? 'Lisa toode' : typed ? 'Lisa' : 'Sulge'}
      onpointerdown={keepFocus}
      onclick={useAddButton}
    >
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  </form>
</div>

<style>
  /* Floats over the list; closed, only the add button shows. */
  .dock {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    padding: 10px 0 max(10px, env(safe-area-inset-bottom));
    pointer-events: none;
    transition: opacity 0.25s;
  }
  /* The bar's backdrop lives on its own layer, so it can fade with the input. */
  .dock::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(16px) saturate(1.5);
    box-shadow: 0 -1px 0 var(--line);
    opacity: 0;
    transition: opacity 0.22s;
  }
  .dock.active {
    padding-top: 8px;
    pointer-events: auto;
  }
  .dock.active::before {
    opacity: 1;
  }
  :global(body.sheet) .dock {
    opacity: 0;
    pointer-events: none;
  }
  .suggestions {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 14px;
    scrollbar-width: none;
    align-items: center;
    max-height: 0;
    min-height: 0;
    opacity: 0;
    pointer-events: none;
    transition: max-height 0.32s var(--ease), opacity 0.22s, padding 0.32s var(--ease), min-height 0.32s var(--ease);
  }
  .suggestions::-webkit-scrollbar {
    display: none;
  }
  .active .suggestions {
    max-height: 64px;
    min-height: 52px;
    padding: 2px 14px 10px;
    opacity: 1;
    pointer-events: auto;
  }
  .chip {
    flex: none;
    height: 40px;
    padding: 0 15px 0 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--card);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    box-shadow: var(--sh);
    white-space: nowrap;
    animation: chip 0.32s var(--ease) both;
    animation-delay: calc(var(--i) * 24ms);
    transition: transform 0.15s;
  }
  .chip:active {
    transform: scale(0.93);
  }
  .chip i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
    flex: none;
  }
  .chip b {
    color: var(--brand);
    font-weight: 800;
  }
  .chip.on-list {
    opacity: 0.5;
  }
  @keyframes chip {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.9);
    }
  }
  .hint {
    color: var(--mut);
    font-size: 14px;
    padding: 0 4px;
    white-space: nowrap;
  }
  .hint b {
    color: var(--ink);
  }
  form {
    display: flex;
    gap: 8px;
    padding: 0 14px;
    max-width: 640px;
    margin: 0 auto;
  }
  /* Fades with the dock; the input stays rendered so iOS opens the keyboard when it's focused on tap. */
  .field {
    flex: 1;
    position: relative;
    opacity: 0;
    transition: opacity 0.22s;
  }
  .active .field {
    opacity: 1;
  }
  input {
    width: 100%;
    height: 52px;
    border-radius: 16px;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: var(--ink);
    font: 500 17px var(--font);
    padding: 0 44px 0 16px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input::placeholder {
    color: var(--mut);
  }
  input:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 16%, transparent);
  }
  .clear {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 28px;
    height: 28px;
    margin-top: -14px;
    border: 0;
    border-radius: 50%;
    background: var(--soft);
    color: var(--mut);
    display: grid;
    place-items: center;
    padding: 0;
  }
  .clear svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .add {
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: 16px;
    border: 0;
    background: var(--brand);
    color: var(--bink);
    display: grid;
    place-items: center;
    pointer-events: auto;
    box-shadow: 0 6px 18px color-mix(in srgb, var(--brand) 35%, transparent);
    transition: transform 0.15s, box-shadow 0.22s;
  }
  .active .add {
    box-shadow: none;
  }
  .add:active {
    transform: scale(0.9);
  }
  .add svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    transition: transform 0.25s var(--ease);
  }
  /* The plus turned into a cross. */
  .add.closes svg {
    transform: rotate(45deg);
  }
</style>
