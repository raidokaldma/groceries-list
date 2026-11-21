import type { Product } from '../shared/products';
import { identifyProduct } from '../shared/products';
import { parseItemInput } from '../shared/quantity';
import { createChangeSet } from '../data/changeSet';
import { findItem, list } from './groceryList.svelte';
import { reactivatedFields } from './itemChanges';

/** Adds typed input like "2 piima", or a picked suggestion with the quantity typed so far. Returns the new item's id. */
export function addItem(input: string, picked?: Product): string | undefined {
  const { name, quantity } = parseItemInput(input);
  if (!picked && !name.trim()) return undefined;
  const product = picked ?? identifyProduct(name, list.history);
  const changes = createChangeSet();
  const id = changes.addItem({
    name: product.name,
    key: product.key,
    quantity,
    department: product.department,
    status: 'active',
    addedAt: Date.now(),
  });
  changes.updateHistory(product.key, { name: product.name, department: product.department, countAs: 'add' });
  changes.commit();
  return id;
}

/** Puts a bought item back on the list. */
export function readdItem(id: string): void {
  const item = findItem(id);
  if (!item) return;
  const changes = createChangeSet();
  changes.updateItem(id, reactivatedFields());
  changes.updateHistory(item.key, { name: item.name, department: item.department, countAs: 'add' });
  changes.commit();
}
