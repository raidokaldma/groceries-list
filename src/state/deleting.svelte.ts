import type { Item } from '../shared/types';
import { createChangeSet } from '../data/changeSet';
import { findItem } from './groceryList.svelte';
import { checkedItems } from './checking';

/** Deletes an item and returns a copy of it, for undo. */
export function deleteItem(id: string): Item | undefined {
  const item = findItem(id);
  if (!item) return undefined;
  checkedItems.delete(id);
  const changes = createChangeSet();
  changes.deleteItem(id);
  changes.commit();
  return $state.snapshot(item) as Item;
}

/** Puts a deleted item back as it was, with its original id. */
export function restoreItem(item: Item): void {
  const changes = createChangeSet();
  changes.restoreItem(item);
  changes.commit();
}
