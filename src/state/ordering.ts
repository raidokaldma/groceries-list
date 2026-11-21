import type { DepartmentId } from '../shared/types';
import { createChangeSet } from '../data/changeSet';
import { activeItemsInOrder, findItem, list } from './groceryList.svelte';
import { moveOtherItemsOfProduct } from './itemChanges';

export type PlacementResult = { kind: 'unchanged' } | { kind: 'saved'; movedTo?: DepartmentId };

/**
 * Saves a dragged item's new place, given the neighbours it was dropped between.
 * Dropping into another department section moves the product there.
 */
export function placeItem(id: string, previousId: string | undefined, nextId: string | undefined, department: DepartmentId | undefined): PlacementResult {
  const item = findItem(id);
  if (!item) return { kind: 'unchanged' };
  const inOrder = activeItemsInOrder();
  const others = inOrder.filter((candidate) => candidate.id !== id);
  const previousIndex = others.findIndex((candidate) => candidate.id === previousId);
  const nextIndex = others.findIndex((candidate) => candidate.id === nextId);
  const insertAt = previousIndex !== -1 ? previousIndex + 1 : nextIndex !== -1 ? nextIndex : inOrder.indexOf(item);
  others.splice(insertAt, 0, item);

  const changes = createChangeSet();
  let changed = false;
  others.forEach((candidate, order) => {
    if (candidate.order === order) return;
    changes.updateItem(candidate.id, { order });
    changed = true;
  });
  const movedTo = department && department !== item.department ? department : undefined;
  if (movedTo) {
    changes.updateItem(id, { department: movedTo });
    moveOtherItemsOfProduct(changes, item.key, movedTo, id);
    changes.updateHistory(item.key, { name: item.name, department: movedTo });
    changed = true;
  }
  if (!changed) return { kind: 'unchanged' };
  changes.commit();
  return { kind: 'saved', movedTo };
}

/**
 * Saves a dragged department's new place, given the shown departments it was dropped between.
 * Departments without items aren't shown, so it is placed next to its shown neighbour in the full order.
 */
export function placeDepartment(department: DepartmentId, previous: DepartmentId | undefined, next: DepartmentId | undefined): PlacementResult {
  const order = list.departmentOrder.filter((candidate) => candidate !== department);
  const insertAt = next ? order.indexOf(next) : previous ? order.indexOf(previous) + 1 : 0;
  order.splice(insertAt, 0, department);
  if (order.join() === list.departmentOrder.join()) return { kind: 'unchanged' };
  const changes = createChangeSet();
  changes.setDepartmentOrder(order);
  changes.commit();
  return { kind: 'saved' };
}
