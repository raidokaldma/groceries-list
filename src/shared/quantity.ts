import type { Quantity } from './types';

const UNIT_ALIASES: Record<string, string> = {
  tk: 'tk', tükk: 'tk', tükki: 'tk', tukki: 'tk', x: 'tk',
  kg: 'kg', kilo: 'kg', kilot: 'kg',
  g: 'g', gr: 'g', grammi: 'g',
  l: 'l', liiter: 'l', liitrit: 'l', ml: 'ml', dl: 'dl', cl: 'cl',
  pk: 'pk', pakk: 'pakk', pakki: 'pakk', pakke: 'pakk',
  purk: 'purk', purki: 'purk',
  pudel: 'pudel', pudeli: 'pudel', pudelit: 'pudel',
  karp: 'karp', karpi: 'karp', kott: 'kott', kotti: 'kott',
  rull: 'rull', rulli: 'rull', kimp: 'kimp', kimpu: 'kimp',
};
const UNITS = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length).join('|');
const NUMBER = '(\\d+(?:[.,]\\d+)?)';
const LEADING_QUANTITY = new RegExp(`^${NUMBER}\\s*(${UNITS})?\\.?(?:\\s+|$)(.*)$`, 'i');
const TRAILING_QUANTITY = new RegExp(`^(.*?\\S)\\s+(?:x\\s*)?${NUMBER}\\s*(${UNITS})?\\.?$`, 'i');
const QUANTITY_ONLY = new RegExp(`^${NUMBER}\\s*(${UNITS})?\\.?$`, 'i');

function measured(amount: string, unit: string | undefined): Quantity {
  return { kind: 'measured', amount: amount.replace('.', ','), unit: unit ? UNIT_ALIASES[unit.toLowerCase()] : 'tk' };
}

/** Splits input like "2 piima", "Piim 2tk", "2l piima" or "piim x2" into name and quantity. */
export function parseItemInput(raw: string): { name: string; quantity?: Quantity } {
  const text = raw.trim().replace(/\s+/g, ' ');
  let match = text.match(LEADING_QUANTITY);
  if (match) return { name: match[3], quantity: measured(match[1], match[2]) };
  match = text.match(TRAILING_QUANTITY);
  if (match) return { name: match[1], quantity: measured(match[2], match[3]) };
  return { name: text };
}

/** Parses the quantity field of the edit form; anything that isn't a number with a unit is kept as text. */
export function parseQuantityField(raw: string): Quantity | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  const match = text.match(QUANTITY_ONLY);
  return match ? measured(match[1], match[2]) : { kind: 'text', text };
}

export function formatQuantity(quantity: Quantity | undefined): string {
  if (!quantity) return '';
  return quantity.kind === 'measured' ? `${quantity.amount} ${quantity.unit}` : quantity.text;
}
