import { SvelteMap } from 'svelte/reactivity';
import type { Item } from '../shared/types';
import { vibrate } from '../shared/haptics';
import { createChangeSet } from '../data/changeSet';
import { list } from './groceryList.svelte';

const UNDO_WINDOW_MS = 1000;
const DRAG_RETRY_MS = 600;
/**
 * Items ticked off on this device. They stay on the list for a short undo window
 * ("awaitingCommit"), then are written as done ("committed") until Firestore reports them done.
 */
export const checkedItems = new SvelteMap<string, 'awaitingCommit' | 'committed'>();

let commitTimer: ReturnType<typeof setTimeout> | undefined;
let isCommitBlocked: () => boolean = () => false;

/** Lets the list postpone committing while the user is dragging rows around. */
export function blockCommitWhile(condition: () => boolean): void {
  isCommitBlocked = condition;
}

/** Every check or uncheck restarts one shared timer; when it fires, all checked items leave together. */
export function toggleItem(id: string): void {
  const state = checkedItems.get(id);
  if (state === 'committed') return;
  if (state === 'awaitingCommit') {
    checkedItems.delete(id);
  } else {
    checkedItems.set(id, 'awaitingCommit');
    vibrate(12);
  }
  clearTimeout(commitTimer);
  if ([...checkedItems.values()].includes('awaitingCommit')) commitTimer = setTimeout(commitCheckedItems, UNDO_WINDOW_MS);
}

export function commitCheckedItems(): void {
  clearTimeout(commitTimer);
  if (isCommitBlocked()) {
    commitTimer = setTimeout(commitCheckedItems, DRAG_RETRY_MS);
    return;
  }
  const purchased = list.items.filter((item) => item.status === 'active' && checkedItems.get(item.id) === 'awaitingCommit');
  if (!purchased.length) return;

  const changes = createChangeSet();
  const doneAt = Date.now();
  const purchasedByKey = Map.groupBy(purchased, (item) => item.key);
  for (const [key, [kept, ...duplicates]] of purchasedByKey) {
    changes.updateItem(kept.id, { status: 'done', doneAt });
    changes.updateHistory(key, { name: kept.name, department: kept.department, countAs: 'purchase' });
    duplicates.forEach((item) => changes.deleteItem(item.id));
    // The done list shows each product once.
    list.items
      .filter((item) => item.status === 'done' && item.key === key)
      .forEach((item) => changes.deleteItem(item.id));
  }
  purchased.forEach((item) => checkedItems.set(item.id, 'committed'));
  changes.commit();
}

/** Forgets ticks for items that Firestore now reports as done or deleted. */
export function forgetFinishedChecks(items: Item[]): void {
  for (const id of checkedItems.keys()) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || item.status === 'done') checkedItems.delete(id);
  }
}
