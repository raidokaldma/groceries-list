<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './header/Header.svelte';
  import ItemList from './list/ItemList.svelte';
  import DoneSection from './list/DoneSection.svelte';
  import InputDock from './dock/InputDock.svelte';
  import EditSheet from './sheet/EditSheet.svelte';
  import Toast from './toast/Toast.svelte';
  import { fitToVisibleArea } from './shared/viewport';
  import { applyTheme } from './theme/theme.svelte';

  onMount(fitToVisibleArea);
  applyTheme();
</script>

<!-- Fixed bars and sheets inside position themselves against the shell, which covers the visible area. -->
<div class="shell">
  <Header />
  <main class="scroller" id="scroller">
    <div class="wrap page">
      <ItemList />
      <DoneSection />
    </div>
  </main>
  <InputDock />
  <EditSheet />
  <Toast />
</div>

<style>
  /* Fixed, so iOS can't scroll the page itself; the list scrolls inside. Script pins it to the visible area. */
  .shell {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--visible-height);
    transform: translateY(var(--visible-top));
    display: flex;
    flex-direction: column;
  }
  .scroller {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scroll-padding-block: calc(var(--headh) + 16px) calc(var(--barh) + 16px);
    /* Drag code measures rows from here. */
    position: relative;
  }
  /* Room to scroll the first and last items out from under the floating header and dock. */
  .page {
    padding-top: var(--headh);
    padding-bottom: var(--barh);
  }
  /* The open dock is a full-width bar, so the list needs clear space above it, not just past the button. */
  :global(body.adding) .page {
    padding-bottom: calc(var(--barh) + 10px);
  }
</style>
