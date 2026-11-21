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

function sortValue(item: Item): number {
  return item.order ?? item.addedAt;
}

export function activeItemsInOrder(): Item[] {
  return list.items.filter((item) => item.status === 'active').sort((a, b) => sortValue(a) - sortValue(b));
}

export function doneItemsNewestFirst(): Item[] {
  return list.items.filter((item) => item.status === 'done').sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
}
