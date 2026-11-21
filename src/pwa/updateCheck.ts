const STORAGE_KEY = 'buildId';

/** Whether this device last ran an older version. Records the running version for next time. */
export function wasUpdatedSinceLastRun(): boolean {
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, __BUILD_ID__);
    return previous !== null && previous !== __BUILD_ID__;
  } catch {
    return false;
  }
}
