import { completeDepartmentOrder } from '../shared/departments';
import { subscribeToDepartmentOrder, subscribeToHistory, subscribeToItems } from '../data/subscriptions';
import { list } from './groceryList.svelte';
import { forgetFinishedChecks } from './checking';

type ListPart = 'items' | 'history' | 'departmentOrder';

/** Keeps the list in sync with Firestore. */
export function connectList(): void {
  // Show the list only once every part has loaded, so it doesn't first render in the default department order.
  const waitingFor = new Set<ListPart>(['items', 'history', 'departmentOrder']);
  function loaded(part: ListPart) {
    waitingFor.delete(part);
    if (!waitingFor.size) list.loadStatus = 'ready';
  }

  subscribeToItems((items) => {
    list.items = items;
    forgetFinishedChecks(items);
    loaded('items');
  });
  subscribeToHistory((history) => {
    list.history = history;
    loaded('history');
  });
  subscribeToDepartmentOrder((order) => {
    list.departmentOrder = completeDepartmentOrder(order);
    loaded('departmentOrder');
  });
}
