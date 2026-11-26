<script lang="ts">
  import { list } from '../../state/groceryList.svelte';
  import { checkedItems } from '../../state/checking';
  import { preferences, savePreferences, type Grouping } from '../../state/preferences.svelte';
  import { isDark } from '../theme/theme.svelte';
  import { exposeHeight } from '../shared/viewport';

  let online = $state(navigator.onLine);

  const remaining = $derived(list.items.filter((item) => item.status === 'active' && !checkedItems.has(item.id)).length);
  const summary = $derived(
    [`${remaining} ${remaining === 1 ? 'toode' : 'toodet'}`, online ? '' : 'võrguühenduseta'].filter(Boolean).join(' · '),
  );

  function toggleTheme() {
    preferences.theme = isDark() ? 'light' : 'dark';
    savePreferences();
  }

  const NEXT_GROUPING: Record<Grouping, Grouping> = { none: 'sorted', sorted: 'grouped', grouped: 'none' };
  const GROUPING_PRESSED: Record<Grouping, 'false' | 'mixed' | 'true'> = { none: 'false', sorted: 'mixed', grouped: 'true' };

  function cycleGrouping() {
    preferences.grouping = NEXT_GROUPING[preferences.grouping];
    savePreferences();
  }
</script>

<svelte:window ononline={() => (online = true)} onoffline={() => (online = false)} />

<header id="header" use:exposeHeight={'--headh'}>
  <div class="wrap">
    <div class="title">
      <h1>Poenimekiri</h1>
      <div class="meta">{list.loadStatus === 'ready' ? summary : ' '}</div>
    </div>
    <button class="pill icon-only" onclick={toggleTheme} aria-pressed={isDark()} aria-label="Tume teema">
      {#if isDark()}
        <svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      {:else}
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      {/if}
    </button>
    <button class="pill" onclick={cycleGrouping} aria-pressed={GROUPING_PRESSED[preferences.grouping]} aria-label="Rühmita osakonniti">
      <svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="18" cy="6" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
      <span class="label">Grupeeri</span>
    </button>
  </div>
</header>

<style>
  /* Floats over the list, so items scroll visibly behind it. */
  header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: calc(env(safe-area-inset-top) + 10px) 16px 8px;
    background: color-mix(in srgb, var(--bg) 72%, transparent);
    backdrop-filter: blur(14px) saturate(1.4);
  }
  .wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .title {
    flex: 1;
  }
  h1 {
    margin: 0;
    font-size: clamp(25px, 7vw, 36px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: -0.025em;
  }
  .meta {
    color: var(--mut);
    font-size: 14px;
    margin-top: 3px;
    font-variant-numeric: tabular-nums;
  }
  .pill {
    height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--card);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 15px;
    box-shadow: var(--sh);
    transition: background 0.25s, color 0.25s, transform 0.15s;
  }
  .pill:active {
    transform: scale(0.95);
  }
  .pill[aria-pressed='true'] {
    background: var(--brand);
    color: var(--bink);
    border-color: transparent;
  }
  .pill[aria-pressed='mixed'] {
    background: color-mix(in srgb, var(--brand) 16%, var(--card));
    color: var(--brand);
    border-color: color-mix(in srgb, var(--brand) 40%, transparent);
  }
  .pill svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon-only {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
  /* The theme button shows its state through the icon, so it keeps the plain look. */
  .icon-only[aria-pressed='true'] {
    background: var(--card);
    color: var(--ink);
    border-color: var(--line);
  }
  @media (max-width: 350px) {
    .label {
      display: none;
    }
    .pill {
      width: 44px;
      padding: 0;
      justify-content: center;
    }
  }
</style>
