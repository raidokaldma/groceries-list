import type { DepartmentId, History, Item } from '../shared/types';
import { DEPARTMENTS } from '../shared/departments';

/** The shared list as Firestore last reported it. */
export const list = $state({
  items: [] as Item[],
  history: {} as History,
  departmentOrder: DEPARTMENTS.map((department) => department.id) as DepartmentId[],
  loadStatus: 'loading' as 'loading' | 'ready',
});

export function findItem(id: string): Item | undefined {
  return list.items.find((item) => item.id === id);
}

/**
 * Items never dragged come first, newest first. Dragging gives every active item a manual `order`,
 * so items added after that still appear on top.
 */
function compareActive(a: Item, b: Item): number {
  if (a.order === undefined && b.order === undefined) return b.addedAt - a.addedAt;
  if (a.order === undefined) return -1;
  if (b.order === undefined) return 1;
  return a.order - b.order;
}

export function activeItemsInOrder(): Item[] {
  return list.items.filter((item) => item.status === 'active').sort(compareActive);
}

export function doneItemsNewestFirst(): Item[] {
  return list.items.filter((item) => item.status === 'done').sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
}
