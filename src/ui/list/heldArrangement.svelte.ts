import { sameArrangement, type ListSection } from './arrangement';

/** How long a dropped arrangement is held if Firestore never reports the write back. */
const SAVE_FALLBACK_MS = 1500;

/**
 * The arrangement shown while dragging, and after a drop until Firestore reports the saved order back;
 * without it the list would briefly jump back to the old order.
 */
export class HeldArrangement {
  sections = $state<ListSection[]>();
  #awaitingSave = false;
  #fallbackTimer: ReturnType<typeof setTimeout> | undefined;

  hold(sections: ListSection[]): void {
    this.release();
    this.sections = $state.snapshot(sections) as ListSection[];
  }

  update(sections: ListSection[]): void {
    if (this.sections && !sameArrangement(sections, this.sections)) this.sections = sections;
  }

  keepUntilSaved(): void {
    this.#awaitingSave = true;
    clearTimeout(this.#fallbackTimer);
    this.#fallbackTimer = setTimeout(() => this.release(), SAVE_FALLBACK_MS);
  }

  /** Call whenever Firestore reports changes to the list. */
  listChanged(): void {
    if (this.#awaitingSave) this.release();
  }

  release(): void {
    this.#awaitingSave = false;
    clearTimeout(this.#fallbackTimer);
    this.sections = undefined;
  }
}
