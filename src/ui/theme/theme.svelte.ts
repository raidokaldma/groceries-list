import { MediaQuery } from 'svelte/reactivity';
import { preferences } from '../../state/preferences.svelte';

const systemPrefersDark = new MediaQuery('(prefers-color-scheme: dark)');

export function isDark(): boolean {
  return preferences.theme === 'system' ? systemPrefersDark.current : preferences.theme === 'dark';
}

/** Mirrors the theme choice onto the page and the browser's status bar colour. */
export function applyTheme(): void {
  $effect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = preferences.theme;
    // Also re-run when the system theme changes, which changes the computed background.
    void isDark();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  });
}
