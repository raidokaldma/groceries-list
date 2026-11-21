import { deleteField, type DocumentData } from 'firebase/firestore';
import type { DepartmentId, HistoryEntry, Item, Quantity } from '../shared/types';
import { isDepartmentId, OTHER_DEPARTMENT } from '../shared/departments';

export type ItemFields = Omit<Item, 'id'>;

function toQuantity(data: unknown): Quantity | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const quantity = data as Record<string, unknown>;
  if (quantity.kind === 'measured') return { kind: 'measured', amount: String(quantity.amount), unit: String(quantity.unit) };
  if (quantity.kind === 'text') return { kind: 'text', text: String(quantity.text) };
  return undefined;
}

/** Unknown or missing departments (from older or newer app versions) fall back to "Muu". */
function toDepartment(value: unknown): DepartmentId {
  return isDepartmentId(value) ? value : OTHER_DEPARTMENT;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export function toItem(id: string, data: DocumentData): Item {
  return {
    id,
    name: String(data.name ?? ''),
    key: String(data.key ?? ''),
    quantity: toQuantity(data.quantity),
    department: toDepartment(data.department),
    status: data.status === 'done' ? 'done' : 'active',
    addedAt: optionalNumber(data.addedAt) ?? 0,
    order: optionalNumber(data.order),
    doneAt: optionalNumber(data.doneAt),
  };
}

/** Firestore rejects undefined values; an optional field that is present but undefined is removed from the document. */
export function toItemData(fields: Partial<ItemFields>): DocumentData {
  const data: DocumentData = {};
  for (const [name, value] of Object.entries(fields)) data[name] = value === undefined ? deleteField() : value;
  return data;
}

export function toNewItemData(fields: ItemFields): DocumentData {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

export function toHistoryEntry(data: DocumentData): HistoryEntry {
  return {
    key: String(data.key ?? ''),
    name: String(data.name ?? ''),
    department: toDepartment(data.department),
    adds: optionalNumber(data.adds) ?? 0,
    purchases: optionalNumber(data.purchases) ?? 0,
    lastUsedAt: optionalNumber(data.lastUsedAt) ?? 0,
  };
}

/** Product keys may contain characters Firestore doesn't allow in document ids, like "/". */
export function historyDocumentId(key: string): string {
  return encodeURIComponent(key);
}
