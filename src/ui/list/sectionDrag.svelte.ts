import { tick } from 'svelte';
import type { DepartmentId } from '../../shared/types';
import { placeDepartment } from '../../state/ordering';
import { moveSection, type ListSection } from './arrangement';
import type { HeldArrangement } from './heldArrangement.svelte';
import { longPressDrag } from './longPressDrag';
import { layoutTop, listScroller, PointerFollower, settleInPlace } from './dragPlacement';
import { unfoldSmoothly } from './unfoldAnimation';

/** Lets the dropped department settle before the others unfold again. */
const UNFOLD_DELAY_MS = 180;

/**
 * Drag a department: long-press its header in grouped view. While dragging, all departments fold
 * to one line so they are easy to reorder.
 */
export class SectionDrag {
  draggingDepartment = $state<DepartmentId>();
  folded = $state(false);
  readonly #pointer = new PointerFollower(1.03);
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
      handle: '.grp > h2',
      canStart: () => true,
      onHold: (header, holding) => header.parentElement!.classList.toggle('ghold', holding),
      onStart: (header, pointerY) => this.#start(header, pointerY),
      onMove: (pointerY) => this.#move(pointerY),
      onDrop: () => this.#drop(),
      scroller: listScroller,
    });
  }

  #section(): HTMLElement | null {
    return this.#listElement().querySelector<HTMLElement>(`.grp[data-department="${this.draggingDepartment}"]`);
  }

  #placeSection(): void {
    const section = this.#section();
    if (section) this.#pointer.place(section);
  }

  async #start(header: HTMLElement, pointerY: number): Promise<void> {
    this.#held.hold(this.#shown());
    this.draggingDepartment = header.parentElement!.dataset.department as DepartmentId;
    this.#pointer.pointerY = pointerY;
    this.folded = true;
    await tick();
    // Folding changes the section's height, so grab it by the middle of its folded size.
    this.#pointer.grabOffset = this.#section()!.offsetHeight / 2;
    this.#placeSection();
  }

  async #move(pointerY: number): Promise<void> {
    this.#pointer.pointerY = pointerY;
    const section = this.#section();
    const sections = this.#held.sections;
    if (!section || !sections || !this.draggingDepartment) return;
    const center = this.#pointer.center(section);
    const before = [...this.#listElement().querySelectorAll<HTMLElement>('.grp')].find(
      (other) => other !== section && layoutTop(other) + other.offsetHeight / 2 > center,
    );
    this.#held.update(moveSection(sections, this.draggingDepartment, before?.dataset.department));
    this.#placeSection();
    await tick();
    this.#placeSection();
  }

  #unfold(): Promise<void> {
    return unfoldSmoothly(this.#listElement(), async () => {
      this.folded = false;
      await tick();
    });
  }

  #drop(): void {
    const department = this.draggingDepartment!;
    const section = this.#section();
    if (section) settleInPlace(section);
    this.draggingDepartment = undefined;
    setTimeout(() => this.#unfold(), UNFOLD_DELAY_MS);

    const shown = (this.#held.sections ?? []).flatMap((candidate) => (candidate.kind === 'department' ? [candidate.id] : []));
    const index = shown.indexOf(department);
    const result = placeDepartment(department, shown[index - 1], shown[index + 1]);
    if (result.kind === 'unchanged') this.#held.release();
    else this.#held.keepUntilSaved();
  }
}
