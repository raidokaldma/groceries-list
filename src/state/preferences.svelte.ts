/** "sorted" orders the list by department without showing department headers. */
export type Grouping = 'none' | 'sorted' | 'grouped';

/** View settings that belong to this device, not to the shared list. */
interface Preferences {
  grouping: Grouping;
  doneExpanded: boolean;
  /** "system" follows the device setting until the user picks a theme. */
  theme: 'system' | 'light' | 'dark';
}

const STORAGE_KEY = 'groceries-list.preferences';

function load(): Preferences {
  const defaults: Preferences = { grouping: 'none', doneExpanded: false, theme: 'system' };
  try {
    const { grouped, ...stored } = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    // Older versions stored grouping as a boolean.
    const migrated = grouped === true ? { grouping: 'grouped' } : {};
    return { ...defaults, ...migrated, ...stored };
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
