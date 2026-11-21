import { tick } from 'svelte';
import { getDepartment } from '../../shared/departments';
import { findItem } from '../../state/groceryList.svelte';
import { checkedItems } from '../../state/checking';
import { placeItem } from '../../state/ordering';
import { showToast } from '../toast/toastState.svelte';
import { moveItem, type ListSection } from './arrangement';
import type { HeldArrangement } from './heldArrangement.svelte';
import { longPressDrag } from './longPressDrag';
import { layoutTop, listScroller, PointerFollower, settleInPlace } from './dragPlacement';

/** Within this distance above a card's first row, a dragged row joins the end of the card before it. */
const PREVIOUS_CARD_MARGIN = 8;

/**
 * Drag a row: long-press, then move. One manual order covers the whole list; grouped view shows that order
 * filtered per department. Dropping a row into another department moves the product there.
 */
export class RowDrag {
  draggingItemId = $state<string>();
  readonly #pointer = new PointerFollower(1.025);
  readonly #listElement: () => HTMLElement;
  readonly #held: HeldArrangement;
  readonly #shown: () => ListSection[];

  constructor(listElement: () => HTMLElement, held: HeldArrangement, shown: () => ListSection[]) {
    this.#listElement = listElement;
    this.#held = held;
    this.#shown = shown;
  }

  attach(): { destroy(): void } {
    return longPressDrag(this.#listElement(), {
      handle: '.row',
      canStart: (row) => !checkedItems.has(row.dataset.id!),
      onHold: (row, holding) => row.classList.toggle('hold', holding),
      onStart: (row, pointerY) => this.#start(row, pointerY),
      onMove: (pointerY) => this.#move(pointerY),
      onDrop: () => this.#drop(),
      scroller: listScroller,
    });
  }

  /** The dragged row's element; it is recreated when the row moves to another department. */
  #row(): HTMLElement | null {
    return this.#listElement().querySelector<HTMLElement>(`.row[data-id="${this.draggingItemId}"]`);
  }

  #placeRow(): void {
    const row = this.#row();
    if (row) this.#pointer.place(row);
  }

  #start(row: HTMLElement, pointerY: number): void {
    this.#held.hold(this.#shown());
    this.draggingItemId = row.dataset.id;
    this.#pointer.pointerY = pointerY;
    this.#pointer.grabOffset = pointerY - row.getBoundingClientRect().top;
    this.#placeRow();
  }

  async #move(pointerY: number): Promise<void> {
    this.#pointer.pointerY = pointerY;
    const row = this.#row();
    const sections = this.#held.sections;
    if (!row || !sections || !this.draggingItemId) return;
    const { sectionId, beforeId } = this.#dropTarget(row);
    this.#held.update(moveItem(sections, this.draggingItemId, sectionId, beforeId));
    this.#placeRow();
    await tick();
    this.#placeRow();
  }

  /** Finds where the dragged row's centre now falls among the other rows. */
  #dropTarget(row: HTMLElement): { sectionId: string; beforeId: string | undefined } {
    const listElement = this.#listElement();
    const center = this.#pointer.center(row);
    const cards = [...listElement.querySelectorAll<HTMLElement>('.card')];
    for (const other of listElement.querySelectorAll<HTMLElement>('.row')) {
      if (other === row || layoutTop(other) + other.offsetHeight / 2 <= center) continue;
      const card = other.parentElement!;
      const previousCard = cards[cards.indexOf(card) - 1];
      const isFirstRow = !other.previousElementSibling;
      if (isFirstRow && previousCard && center < layoutTop(card) - PREVIOUS_CARD_MARGIN) {
        return { sectionId: previousCard.dataset.section!, beforeId: undefined };
      }
      return { sectionId: card.dataset.section!, beforeId: other.dataset.id };
    }
    return { sectionId: cards.at(-1)!.dataset.section!, beforeId: undefined };
  }

  #drop(): void {
    const id = this.draggingItemId!;
    const row = this.#row();
    if (row) settleInPlace(row);
    this.draggingItemId = undefined;

    const section = this.#held.sections?.find((candidate) => candidate.itemIds.includes(id));
    if (!section) return this.#held.release();
    const index = section.itemIds.indexOf(id);
    const department = section.kind === 'department' ? section.id : undefined;
    const result = placeItem(id, section.itemIds[index - 1], section.itemIds[index + 1], department);
    if (result.kind === 'unchanged') return this.#held.release();
    this.#held.keepUntilSaved();
    if (result.movedTo) showToast(`${findItem(id)?.name} → ${getDepartment(result.movedTo).name}`);
  }
}
