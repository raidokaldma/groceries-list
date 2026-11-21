import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import type { DepartmentId, Item } from '../shared/types';
import { db } from './firebase';
import { historyDocumentId, toItemData, toNewItemData, type ItemFields } from './mapping';
import { DEPARTMENT_ORDER_DOCUMENT, HISTORY, ITEMS, SETTINGS } from './collections';

export interface HistoryUpdate {
  name: string;
  department: DepartmentId;
  /** Counts the change as the product being added to the list or bought; left out, only name and department are kept. */
  countAs?: 'add' | 'purchase';
}

/**
 * Collects writes and applies them atomically. Firestore shows them locally right away and
 * syncs when online, so callers never wait for commit.
 */
export function createChangeSet() {
  const batch = writeBatch(db);

  return {
    addItem(fields: ItemFields): string {
      const reference = doc(collection(db, ITEMS));
      batch.set(reference, toNewItemData(fields));
      return reference.id;
    },
    restoreItem(item: Item) {
      const { id, ...fields } = item;
      batch.set(doc(db, ITEMS, id), toNewItemData(fields));
    },
    updateItem(id: string, fields: Partial<ItemFields>) {
      batch.update(doc(db, ITEMS, id), toItemData(fields));
    },
    deleteItem(id: string) {
      batch.delete(doc(db, ITEMS, id));
    },
    updateHistory(key: string, { name, department, countAs }: HistoryUpdate) {
      batch.set(doc(db, HISTORY, historyDocumentId(key)), {
        key,
        name,
        department,
        ...(countAs && { lastUsedAt: Date.now() }),
        ...(countAs === 'add' && { adds: increment(1) }),
        ...(countAs === 'purchase' && { purchases: increment(1) }),
      }, { merge: true });
    },
    setDepartmentOrder(order: DepartmentId[]) {
      batch.set(doc(db, SETTINGS, DEPARTMENT_ORDER_DOCUMENT), { order });
    },
    commit() {
      batch.commit().catch((error) => console.error('Firestore write failed', error));
    },
  };
}

export type ChangeSet = ReturnType<typeof createChangeSet>;
