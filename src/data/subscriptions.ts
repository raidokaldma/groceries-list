import { collection, doc, onSnapshot } from 'firebase/firestore';
import type { History, Item } from '../shared/types';
import { db } from './firebase';
import { toHistoryEntry, toItem } from './mapping';
import { HISTORY, ITEMS, SETTINGS, DEPARTMENT_ORDER_DOCUMENT } from './collections';

function logError(error: Error) {
  console.error('Firestore subscription failed', error);
}

export function subscribeToItems(onChange: (items: Item[]) => void): () => void {
  return onSnapshot(collection(db, ITEMS), (snapshot) => onChange(snapshot.docs.map((document) => toItem(document.id, document.data()))), logError);
}

export function subscribeToHistory(onChange: (history: History) => void): () => void {
  return onSnapshot(collection(db, HISTORY), (snapshot) => {
    const history: History = {};
    for (const document of snapshot.docs) {
      const entry = toHistoryEntry(document.data());
      history[entry.key] = entry;
    }
    onChange(history);
  }, logError);
}

export function subscribeToDepartmentOrder(onChange: (order: unknown[]) => void): () => void {
  return onSnapshot(doc(db, SETTINGS, DEPARTMENT_ORDER_DOCUMENT), (snapshot) => {
    const order = snapshot.data()?.order;
    onChange(Array.isArray(order) ? order : []);
  }, logError);
}
