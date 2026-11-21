import type { Department, DepartmentId } from './types';

export const DEPARTMENTS: Department[] = [
  { id: 'puu', name: 'Puu- ja köögiviljad', color: '#3e9150' },
  { id: 'leib', name: 'Leib ja saiad', color: '#c58a35' },
  { id: 'piim', name: 'Piimatooted ja munad', color: '#4f86d4' },
  { id: 'liha', name: 'Liha ja kala', color: '#d2503c' },
  { id: 'kulm', name: 'Külmutatud', color: '#3fa9c2' },
  { id: 'kuiv', name: 'Kuivained ja hommikusöök', color: '#b39132' },
  { id: 'kons', name: 'Konservid, kastmed, maitseained', color: '#a2603a' },
  { id: 'magus', name: 'Maiustused ja snäkid', color: '#cf5f97' },
  { id: 'jook', name: 'Joogid', color: '#7466cf' },
  { id: 'kodu', name: 'Kodu ja majapidamine', color: '#64798b' },
  { id: 'hyg', name: 'Hügieen ja apteek', color: '#3f9a8f' },
  { id: 'muu', name: 'Muu', color: '#8b8f8c' },
];

const departmentsById = new Map(DEPARTMENTS.map((department) => [department.id, department]));

export const OTHER_DEPARTMENT: DepartmentId = 'muu';

export function isDepartmentId(value: unknown): value is DepartmentId {
  return typeof value === 'string' && departmentsById.has(value as DepartmentId);
}

export function getDepartment(id: DepartmentId): Department {
  return departmentsById.get(id) ?? departmentsById.get(OTHER_DEPARTMENT)!;
}

/** Keeps a saved order valid: drops unknown ids and inserts new departments before "Muu". */
export function completeDepartmentOrder(saved: unknown[]): DepartmentId[] {
  const order = saved.filter(isDepartmentId);
  for (const { id } of DEPARTMENTS) {
    if (order.includes(id)) continue;
    const otherIndex = order.indexOf(OTHER_DEPARTMENT);
    order.splice(otherIndex === -1 ? order.length : otherIndex, 0, id);
  }
  return order;
}
