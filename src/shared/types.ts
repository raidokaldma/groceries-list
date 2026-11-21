export type DepartmentId =
  | 'puu' | 'leib' | 'piim' | 'liha' | 'kulm' | 'kuiv'
  | 'kons' | 'magus' | 'jook' | 'kodu' | 'hyg' | 'muu';

export interface Department {
  id: DepartmentId;
  name: string;
  color: string;
}

export type Quantity =
  | { kind: 'measured'; amount: string; unit: string }
  | { kind: 'text'; text: string };

export type ItemStatus = 'active' | 'done';

export interface Item {
  id: string;
  name: string;
  /** Normalised product identity, shared by all spellings and inflections of the same product. */
  key: string;
  quantity?: Quantity;
  department: DepartmentId;
  status: ItemStatus;
  addedAt: number;
  /** Manual position set by drag and drop; items never dragged sort by addedAt. */
  order?: number;
  doneAt?: number;
}

export interface HistoryEntry {
  key: string;
  name: string;
  department: DepartmentId;
  adds: number;
  purchases: number;
  lastUsedAt: number;
}

export type History = Record<string, HistoryEntry>;
