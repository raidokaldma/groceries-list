import { EASE_OUT, prefersReducedMotion } from '../shared/motion';

/** The list's scroll container, between the header and the input dock. */
export function listScroller(): HTMLElement {
  return document.getElementById('scroller')!;
}

/** Top of an element in the viewport, ignoring transforms from running animations. */
export function layoutTop(element: HTMLElement): number {
  const scroller = listScroller();
  let top = 0;
  for (let current: HTMLElement | null = element; current && current !== scroller; current = current.offsetParent as HTMLElement | null) top += current.offsetTop;
  return scroller.getBoundingClientRect().top + top - scroller.scrollTop;
}

/** Keeps a dragged element under the pointer, at the spot where it was grabbed. */
export class PointerFollower {
  pointerY = 0;
  grabOffset = 0;
  readonly #scale: number;

  constructor(scale: number) {
    this.#scale = scale;
  }

  /** The dragged element's vertical centre, where it would be laid out if dropped now. */
  center(element: HTMLElement): number {
    return this.pointerY - this.grabOffset + element.offsetHeight / 2;
  }

  place(element: HTMLElement): void {
    element.style.transform = `translateY(${this.pointerY - this.grabOffset - layoutTop(element)}px) scale(${this.#scale})`;
  }
}

/** Animates a dropped element from where the pointer left it into its place in the list. */
export function settleInPlace(element: HTMLElement): void {
  const from = element.style.transform;
  element.style.transform = '';
  if (!prefersReducedMotion()) element.animate([{ transform: from }, { transform: 'none' }], { duration: 220, easing: EASE_OUT });
}
