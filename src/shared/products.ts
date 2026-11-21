import type { DepartmentId, History, HistoryEntry } from './types';
import { OTHER_DEPARTMENT } from './departments';
import { findEntry, findSingleWordEntry, guessDepartment } from './matching';
import { capitalize, fold, tokenize } from './text';

export interface Product {
  key: string;
  name: string;
  department: DepartmentId;
}

/** Resolves what the user typed to a product, preferring what they named or filed it as before. */
export function identifyProduct(typedName: string, history: History): Product {
  const tokens = tokenize(typedName);
  const entry = findEntry(tokens);
  const key = entry ? fold(entry.displayName) : keyFromWords(tokens) || fold(typedName.trim());
  const known = history[key];
  return {
    key,
    name: known?.name ?? entry?.displayName ?? capitalize(typedName.trim()),
    department: known?.department ?? entry?.department ?? guessDepartment(tokens) ?? OTHER_DEPARTMENT,
  };
}

/** An unknown phrase is keyed by its words, each reduced to a known product where possible ("värske piima" → "varske piim"). */
function keyFromWords(tokens: string[]): string {
  return tokens
    .map((word) => {
      const known = findSingleWordEntry(word);
      return known ? fold(known.displayName) : word;
    })
    .join(' ');
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** How likely the user wants this product again: frequent purchases, frequent adds, recent use. */
export function popularity(entry: HistoryEntry, now: number): number {
  return 28 * Math.log2(1 + entry.purchases) + 8 * Math.log2(1 + entry.adds) + 18 * Math.exp(-(now - entry.lastUsedAt) / THIRTY_DAYS_MS);
}
