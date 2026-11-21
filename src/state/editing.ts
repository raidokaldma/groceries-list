import type { DepartmentId } from '../shared/types';
import { identifyProduct } from '../shared/products';
import { capitalize } from '../shared/text';
import { parseQuantityField } from '../shared/quantity';
import { createChangeSet } from '../data/changeSet';
import { findItem, list } from './groceryList.svelte';
import { moveOtherItemsOfProduct, reactivatedFields } from './itemChanges';

export interface ItemEdit {
  name: string;
  quantityText: string;
  department: DepartmentId;
}

/** Saves the edit form. Saving a done item puts it back on the list. */
export function saveItemEdit(id: string, edit: ItemEdit): boolean {
  const item = findItem(id);
  const typedName = edit.name.trim();
  if (!item || !typedName) return false;

  const product = identifyProduct(typedName, list.history);
  const name = capitalize(typedName);
  const wasDone = item.status === 'done';
  const changes = createChangeSet();
  changes.updateItem(id, {
    name,
    key: product.key,
    quantity: parseQuantityField(edit.quantityText),
    department: edit.department,
    ...(wasDone && reactivatedFields()),
  });
  moveOtherItemsOfProduct(changes, product.key, edit.department, id);
  changes.updateHistory(product.key, { name, department: edit.department, countAs: wasDone ? 'add' : undefined });
  changes.commit();
  return true;
}
