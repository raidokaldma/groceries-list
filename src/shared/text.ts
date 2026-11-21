/** Lower-cases and strips diacritics, so "Õunad" and "ounad" compare equal. */
export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function tokenize(text: string): string[] {
  return fold(text).split(/[^a-z]+/).filter(Boolean);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
