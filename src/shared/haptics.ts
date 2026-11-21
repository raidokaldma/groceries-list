/** A short vibration as touch feedback. Optional: browsers without vibration (iOS Safari) ignore it. */
export function vibrate(milliseconds: number): void {
  try {
    navigator.vibrate?.(milliseconds);
  } catch {
    // Some browsers throw when vibration isn't allowed; the feedback is optional.
  }
}
