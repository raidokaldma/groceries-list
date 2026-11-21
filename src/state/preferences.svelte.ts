/** View settings that belong to this device, not to the shared list. */
interface Preferences {
  grouped: boolean;
  doneExpanded: boolean;
  /** "system" follows the device setting until the user picks a theme. */
  theme: 'system' | 'light' | 'dark';
}

const STORAGE_KEY = 'groceries-list.preferences';

function load(): Preferences {
  const defaults: Preferences = { grouped: false, doneExpanded: false, theme: 'system' };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

export const preferences = $state<Preferences>(load());

export function savePreferences(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode); the preference then lasts for this session only.
  }
}
