import { deleteItem, restoreItem } from '../../state/deleting.svelte';
import { showToast } from '../toast/toastState.svelte';

export function deleteWithUndo(id: string): void {
  const deleted = deleteItem(id);
  if (deleted) showToast(`${deleted.name} kustutatud`, () => restoreItem(deleted));
}
