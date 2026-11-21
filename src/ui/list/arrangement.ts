import type { DepartmentId, Item } from '../../shared/types';

/** One card on screen: a department in grouped view, or the whole list in flat view. */
export type ListSection = { kind: 'department'; id: DepartmentId; itemIds: string[] } | { kind: 'flat'; id: 'all'; itemIds: string[] };

export function arrange(items: Item[], grouped: boolean, departmentOrder: DepartmentId[]): ListSection[] {
  if (!grouped) return [{ kind: 'flat', id: 'all', itemIds: items.map((item) => item.id) }];
  return departmentOrder
    .map((department): ListSection => ({
      kind: 'department',
      id: department,
      itemIds: items.filter((item) => item.department === department).map((item) => item.id),
    }))
    .filter((section) => section.itemIds.length);
}

/** Moves an item before another item, or to the end of a section when no item follows it. */
export function moveItem(sections: ListSection[], itemId: string, sectionId: string, beforeId: string | undefined): ListSection[] {
  return sections.map((section) => {
    const itemIds = section.itemIds.filter((id) => id !== itemId);
    if (section.id === sectionId) {
      const index = beforeId ? itemIds.indexOf(beforeId) : -1;
      itemIds.splice(index === -1 ? itemIds.length : index, 0, itemId);
    }
    return { ...section, itemIds };
  });
}

export function moveSection(sections: ListSection[], sectionId: string, beforeId: string | undefined): ListSection[] {
  const moved = sections.find((section) => section.id === sectionId)!;
  const others = sections.filter((section) => section !== moved);
  const index = beforeId ? others.findIndex((section) => section.id === beforeId) : -1;
  others.splice(index === -1 ? others.length : index, 0, moved);
  return others;
}

export function sameArrangement(a: ListSection[], b: ListSection[]): boolean {
  return a.length === b.length && a.every((section, i) => section.id === b[i].id && section.itemIds.join() === b[i].itemIds.join());
}
