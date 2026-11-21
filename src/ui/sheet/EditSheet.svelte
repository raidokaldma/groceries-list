<script lang="ts">
  import { saveItemEdit } from '../../state/editing';
  import { deleteWithUndo } from '../shared/deleteWithUndo';
  import { closeEditSheet, editSheet } from './editSheetState.svelte';
  import { dragToClose } from './dragToClose';
  import DepartmentPicker from './DepartmentPicker.svelte';

  let backdrop: HTMLElement;
  let nameInput = $state<HTMLInputElement>();
  $effect(() => {
    if (!editSheet.open || !nameInput) return;
    // preventScroll: the sheet is still sliding in, and scrolling to the input would make it jump.
    nameInput.focus({ preventScroll: true });
    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
  });

  $effect(() => {
    document.body.classList.toggle('sheet', editSheet.open);
  });

  function save() {
    const draft = editSheet.draft;
    if (draft && saveItemEdit(draft.itemId, draft)) closeEditSheet();
  }

  function remove() {
    const draft = editSheet.draft;
    if (!draft) return;
    closeEditSheet();
    deleteWithUndo(draft.itemId);
  }

  function saveOnEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    save();
  }
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && editSheet.open && closeEditSheet()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" class:open={editSheet.open} bind:this={backdrop} onclick={(event) => event.target === backdrop && closeEditSheet()}>
  <div class="panel" role="dialog" aria-modal="true" use:dragToClose={{ backdrop: () => backdrop, onClose: closeEditSheet }}>
    {#if editSheet.draft}
      {@const draft = editSheet.draft}
      <button type="button" class="grab" onclick={closeEditSheet} aria-label="Sulge"></button>
      <label class="field first">
        <span>Nimi</span>
        <input bind:this={nameInput} bind:value={draft.name} onkeydown={saveOnEnter} autocomplete="off" enterkeyhint="done" />
      </label>
      <label class="field">
        <span>Kogus</span>
        <input bind:value={draft.quantityText} onkeydown={saveOnEnter} placeholder="nt 2 tk, 1 kg, 500 g" autocomplete="off" enterkeyhint="done" />
      </label>
      <div class="field">
        <span>Osakond</span>
        <!-- Keyed on the draft, so the picker starts collapsed for every item. -->
        {#key draft}<DepartmentPicker bind:department={draft.department} />{/key}
      </div>
      <div class="actions">
        <button type="button" class="button danger" onclick={remove}>Kustuta</button>
        <span></span>
        <button type="button" class="button" onclick={closeEditSheet}>Loobu</button>
        <button type="button" class="button primary" onclick={save}>{draft.isDone ? 'Lisa' : 'Salvesta'}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(8, 14, 10, 0);
    visibility: hidden;
    transition: background 0.3s, visibility 0s 0.38s;
  }
  .backdrop.open {
    background: rgba(8, 14, 10, 0.42);
    visibility: visible;
    transition: background 0.3s;
  }
  .panel {
    width: 100%;
    max-width: 640px;
    /* The backdrop covers the visible area, which excludes the on-screen keyboard. */
    max-height: min(88%, 100% - 24px);
    overflow: auto;
    overscroll-behavior: contain;
    background: var(--card);
    border-radius: 24px 24px 0 0;
    padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
    transform: translateY(100%);
    transition: transform 0.4s var(--ease);
  }
  .open .panel {
    transform: none;
  }
  .grab {
    display: block;
    width: 100%;
    height: 28px;
    margin: -10px 0 4px;
    border: 0;
    background: none;
    padding: 0;
    touch-action: none;
    cursor: grab;
  }
  .grab::before {
    content: '';
    display: block;
    width: 40px;
    height: 5px;
    border-radius: 9px;
    background: var(--line);
    margin: 10px auto 0;
  }
  .field {
    display: block;
    margin-top: 14px;
  }
  .field.first {
    margin-top: 0;
  }
  .field > span {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: var(--mut);
    margin-bottom: 6px;
  }
  .field input {
    width: 100%;
    height: 50px;
    border-radius: 14px;
    border: 1.5px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font: 500 17px var(--font);
    padding: 0 14px;
    outline: none;
  }
  .field input:focus {
    border-color: var(--brand);
  }
  .actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 20px;
  }
  .actions span {
    flex: 1;
  }
  .button {
    height: 48px;
    padding: 0 20px;
    border-radius: 14px;
    border: 0;
    font-weight: 700;
    font-size: 16px;
    background: var(--soft);
  }
  .button.primary {
    background: var(--brand);
    color: var(--bink);
  }
  .button.danger {
    background: none;
    color: var(--acc);
    padding: 0 6px;
  }
</style>
