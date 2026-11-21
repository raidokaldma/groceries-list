import { flip } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { isDragging } from './longPressDrag';

/* Transitions for list rows and department sections. They are skipped while dragging: rows are recreated
   as they cross departments, and that must not look like adding or removing. */

/** How long rows, sections and the bought list take to move into place, so they move together. */
export const moveDuration = 440;
/** Faster while dragging, so rows and sections moving aside keep up with the pointer. Folding sections runs at it too. */
export const dragMoveDuration = 200;

/**
 * Adding a row or section. Used with transition:, so removing plays the same motion backwards.
 * A swiped-away row is the exception: it is already off to the side, so it stays there while its red panel
 * shrinks with the gap (min-height:0 so the row's own min-height doesn't stop it from shrinking).
 */
export function appear(node: HTMLElement) {
  if (isDragging()) return { duration: 0 };
  if (node.classList.contains('swiping')) {
    const height = node.offsetHeight;
    return { duration: moveDuration, easing: cubicOut, css: (t: number) => `min-height:0;height:${t * height}px` };
  }
  return {
    duration: moveDuration,
    easing: cubicOut,
    css: (t: number, u: number) => `opacity:${t};transform:translateY(${16 * u}px) scale(${0.97 + 0.03 * t})`,
  };
}

/** FLIP for reordering, except for the element under the pointer, which follows the pointer instead. */
export function reorder(node: HTMLElement, { from, to }: { from: DOMRect; to: DOMRect }, options: { duration: number }) {
  if (node.classList.contains('drag')) return { duration: 0 };
  // Move only. flip also scales from the old size, which squashes a section's rows when one is added or removed.
  const fromAtFinalSize = new DOMRect(from.left, from.top, to.width, to.height);
  return flip(node, { from: fromAtFinalSize, to }, { duration: options.duration, easing: cubicOut });
}
