const VISIBLE_MS = 5000;

export const toast = $state({ visible: false, message: '', undo: undefined as (() => void) | undefined });
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, undo?: () => void): void {
  Object.assign(toast, { visible: true, message, undo });
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideToast, VISIBLE_MS);
}

export function hideToast(): void {
  toast.visible = false;
}
