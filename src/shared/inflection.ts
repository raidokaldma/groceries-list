/** Estonian case endings and plural markers that may follow a stem ("piim" → "piima", "munad" → "mune"). */
const INFLECTION_ENDINGS = new Set(['', 'a', 'e', 'i', 'u', 'o', 'd', 't', 'ad', 'ed', 'id', 'ud', 'od', 'at', 'et', 'it', 'ut', 'ot', 'sid', 'eid', 'teid', 'de', 'te', 'st', 'ga']);

export function stemOf(word: string): string {
  return word.length > 3 && /[aeiou]$/.test(word) ? word.slice(0, -1) : word;
}

export function isInflectionEnding(text: string): boolean {
  return INFLECTION_ENDINGS.has(text);
}

function isInflectionOf(word: string, base: string): boolean {
  const stem = stemOf(base);
  return word.startsWith(stem) && isInflectionEnding(word.slice(stem.length));
}

/** Whether two folded words are the same word, possibly in different grammatical forms. */
export function wordsMatch(a: string, b: string): boolean {
  return a === b || (a.length >= 3 && b.length >= 3 && (isInflectionOf(a, b) || isInflectionOf(b, a)));
}
