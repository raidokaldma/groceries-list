import type { DepartmentId } from '../shared/types';
import type { ItemFields } from '../data/mapping';
import type { ChangeSet } from '../data/changeSet';
import { list } from './groceryList.svelte';

/** Fields that put a done item back on the list, at the end. */
export function reactivatedFields(): Partial<ItemFields> {
  return { status: 'active', addedAt: Date.now(), order: undefined, doneAt: undefined };
}

/** The department belongs to the product, so every other item of the same product moves along. */
export function moveOtherItemsOfProduct(changes: ChangeSet, key: string, department: DepartmentId, exceptId: string): void {
  list.items
    .filter((item) => item.key === key && item.id !== exceptId && item.department !== department)
    .forEach((item) => changes.updateItem(item.id, { department }));
}
