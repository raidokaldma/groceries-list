import type { History, Quantity } from './types';
import type { Product } from './products';
import { identifyProduct, popularity } from './products';
import { VOCABULARY } from './matching';
import { fold, tokenize } from './text';
import { wordsMatch } from './inflection';
import { parseItemInput } from './quantity';
import { STAPLES } from './vocabulary';

const MAX_FAVOURITES = 12;
const MAX_MATCHES = 8;
/** Products already on the list are still offered, but below the rest. */
const ON_LIST_PENALTY = 40;

export interface Suggestion extends Product {
  alreadyOnList: boolean;
  score: number;
}

/** Suggestions for the add input: favourites while it is empty, matches for what is typed otherwise. */
export function suggest(input: string, history: History, keysOnList: Set<string>): { quantity?: Quantity; suggestions: Suggestion[] } {
  const { name, quantity } = parseItemInput(input);
  const query = fold(name).trim();
  const pool = new SuggestionPool(keysOnList);
  if (query) {
    offerMatches(pool, query, tokenize(name), history);
    return { quantity, suggestions: pool.best(MAX_MATCHES) };
  }
  offerFavourites(pool, history);
  return { quantity, suggestions: pool.best(MAX_FAVOURITES) };
}

/** Collects candidate products, keeping each product's best score. */
class SuggestionPool {
  readonly #byKey = new Map<string, Suggestion>();
  readonly #keysOnList: Set<string>;

  constructor(keysOnList: Set<string>) {
    this.#keysOnList = keysOnList;
  }

  isOnList(key: string): boolean {
    return this.#keysOnList.has(key);
  }

  has(key: string): boolean {
    return this.#byKey.has(key);
  }

  offer({ key, name, department }: Product, score: number): void {
    const alreadyOnList = this.isOnList(key);
    if (alreadyOnList) score -= ON_LIST_PENALTY;
    const existing = this.#byKey.get(key);
    if (!existing || existing.score < score) this.#byKey.set(key, { key, name, department, alreadyOnList, score });
  }

  best(count: number): Suggestion[] {
    return [...this.#byKey.values()].sort((a, b) => b.score - a.score).slice(0, count);
  }
}

/** With nothing typed: what the user buys most, then common staples, leaving out what is already on the list. */
function offerFavourites(pool: SuggestionPool, history: History): void {
  const now = Date.now();
  for (const entry of Object.values(history)) {
    if (!pool.isOnList(entry.key)) pool.offer(entry, popularity(entry, now) + 20);
  }
  STAPLES.forEach((staple, i) => {
    const product = identifyProduct(staple, history);
    if (!pool.isOnList(product.key) && !pool.has(product.key)) pool.offer(product, 10 - i * 0.3);
  });
}

/** Products from history and the vocabulary that match the typed text; history wins for the same product. */
function offerMatches(pool: SuggestionPool, query: string, queryTokens: string[], history: History): void {
  const now = Date.now();
  for (const entry of Object.values(history)) {
    const score = matchScore(query, queryTokens, [fold(entry.name)]);
    if (score) pool.offer(entry, score + popularity(entry, now) + 12);
  }
  for (const entry of VOCABULARY) {
    const score = matchScore(query, queryTokens, entry.foldedForms);
    if (!score) continue;
    const key = fold(entry.displayName);
    if (pool.has(key)) continue;
    const known = history[key];
    const product = { key, name: known?.name ?? entry.displayName, department: known?.department ?? entry.department };
    // Shorter names are usually the more general product the user means.
    pool.offer(product, score - entry.displayName.length * 0.2 + (STAPLES.includes(entry.displayName) ? 9 : 0));
  }
}

/** How well the typed text matches the best of a product's names: whole name, prefix, word prefix, substring or inflection. */
function matchScore(query: string, queryTokens: string[], candidates: string[]): number {
  let best = 0;
  for (const candidate of candidates) {
    let score = 0;
    if (candidate === query) score = 100;
    else if (candidate.startsWith(query)) score = 82;
    else if (candidate.split(/[^a-z]+/).some((word) => word.startsWith(query))) score = 66;
    else if (query.length >= 3 && candidate.includes(query)) score = 46;
    if (score < 72 && query.length >= 3 && queryTokens.length) {
      const candidateTokens = candidate.split(/[^a-z]+/).filter(Boolean);
      if (candidateTokens.length && wordsMatch(queryTokens.at(-1)!, candidateTokens.at(-1)!)) score = 72;
    }
    best = Math.max(best, score);
  }
  return best;
}
