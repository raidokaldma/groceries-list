import type { DepartmentId } from '../../shared/types';
import { formatQuantity } from '../../shared/quantity';
import { findItem } from '../../state/groceryList.svelte';

export interface EditDraft {
  itemId: string;
  name: string;
  quantityText: string;
  department: DepartmentId;
  isDone: boolean;
}

/** The draft outlives closing so the sheet keeps its content while sliding away. */
export const editSheet = $state({ open: false, draft: undefined as EditDraft | undefined });

export function openEditSheet(id: string): void {
  const item = findItem(id);
  if (!item) return;
  editSheet.draft = {
    itemId: id,
    name: item.name,
    quantityText: formatQuantity(item.quantity),
    department: item.department,
    isDone: item.status === 'done',
  };
  editSheet.open = true;
}

export function closeEditSheet(): void {
  editSheet.open = false;
  (document.activeElement as HTMLElement | null)?.blur();
}
