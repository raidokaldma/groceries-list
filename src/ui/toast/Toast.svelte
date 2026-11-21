<script lang="ts">
  import { hideToast, toast } from './toastState.svelte';

  function undo() {
    toast.undo?.();
    hideToast();
  }
</script>

<div class="toast" class:show={toast.visible} role="status">
  <span>{toast.message}</span>
  {#if toast.undo}<button type="button" onclick={undo}>Võta tagasi</button>{/if}
</div>

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(var(--barh) + 12px);
    z-index: 15;
    transform: translate(-50%, 20px);
    opacity: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--ink);
    color: var(--bg);
    padding: 8px 18px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    transition: transform 0.35s var(--ease), opacity 0.3s;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  .toast:has(button) {
    padding-right: 8px;
  }
  .toast.show {
    transform: translate(-50%, 0);
    opacity: 1;
    pointer-events: auto;
  }
  button {
    height: 36px;
    border: 0;
    border-radius: 999px;
    padding: 0 14px;
    background: color-mix(in srgb, var(--bg) 18%, transparent);
    color: var(--bg);
    font-weight: 800;
  }
</style>
