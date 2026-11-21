import type { DepartmentId } from './types';
import { PRODUCTS_BY_DEPARTMENT } from './vocabulary';
import { fold, tokenize } from './text';
import { isInflectionEnding, stemOf, wordsMatch } from './inflection';

export interface VocabularyEntry {
  displayName: string;
  department: DepartmentId;
  foldedForms: string[];
  formTokens: string[][];
}

export const VOCABULARY: VocabularyEntry[] = Object.entries(PRODUCTS_BY_DEPARTMENT).flatMap(([department, products]) =>
  products.split(',').map((product) => {
    const forms = product.split('|').map((form) => form.trim());
    return {
      displayName: forms[0],
      department: department as DepartmentId,
      foldedForms: forms.map(fold),
      formTokens: forms.map(tokenize),
    };
  }),
);

export function findEntry(tokens: string[]): VocabularyEntry | undefined {
  if (!tokens.length) return undefined;
  const joined = tokens.join(' ');
  return (
    VOCABULARY.find((entry) => entry.formTokens.some((form) => form.join(' ') === joined)) ??
    VOCABULARY.find((entry) =>
      entry.formTokens.some((form) => form.length === tokens.length && form.every((word, i) => wordsMatch(tokens[i], word))),
    )
  );
}

export function findSingleWordEntry(word: string): VocabularyEntry | undefined {
  return (
    VOCABULARY.find((entry) => entry.formTokens.some((form) => form.length === 1 && form[0] === word)) ??
    VOCABULARY.find((entry) => entry.formTokens.some((form) => form.length === 1 && wordsMatch(word, form[0])))
  );
}

/**
 * Guesses the department of an unknown product from its words. Estonian puts the head noun last
 * ("hapu kurk"), and compounds end with a known word ("rukkileib" ends with "leib").
 */
export function guessDepartment(tokens: string[]): DepartmentId | undefined {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const entry = findSingleWordEntry(tokens[i]);
    if (entry) return entry.department;
  }
  for (let i = tokens.length - 1; i >= 0; i--) {
    const entry = VOCABULARY.find((candidate) =>
      candidate.formTokens.some((form) => form.length > 1 && wordsMatch(tokens[i], form.at(-1)!)),
    );
    if (entry) return entry.department;
  }
  return guessFromCompoundEnding(tokens);
}

function guessFromCompoundEnding(tokens: string[]): DepartmentId | undefined {
  let best: DepartmentId | undefined;
  let bestStemLength = 0;
  for (const word of tokens) {
    for (const entry of VOCABULARY) {
      for (const form of entry.formTokens) {
        if (form.length !== 1) continue;
        const stem = stemOf(form[0]);
        if (stem.length < 4 || stem.length <= bestStemLength) continue;
        for (let start = 2; start + stem.length <= word.length; start++) {
          if (word.startsWith(stem, start) && isInflectionEnding(word.slice(start + stem.length))) {
            best = entry.department;
            bestStemLength = stem.length;
            break;
          }
        }
      }
    }
  }
  return best;
}
