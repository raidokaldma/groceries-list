import { EASE_OUT } from '../shared/motion';
import { moveDuration } from './transitions';

/**
 * Slides the element to its new place when content above it changes height, instead of letting it jump.
 * Svelte takes removed rows and sections out of the layout at once (animate: makes them absolute while they fade),
 * so without this whatever follows the list jumps up and the fading block draws over it.
 */
export function slideWhenPushed(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return;
  // offsetTop ignores transforms, so it is the element's place in the layout even mid-slide.
  let lastTop = element.offsetTop;
  // Content above moving the element resizes the parent, unless the element grows by the same amount
  // (a bought row moving from the list into it), so both are watched.
  // Runs after layout and before paint, so the jump is never shown.
  const observer = new ResizeObserver(() => {
    const shift = element.offsetTop - lastTop;
    lastTop = element.offsetTop;
    if (shift === 0) return;
    element.animate([{ transform: `translateY(${-shift}px)` }, { transform: 'none' }], {
      duration: moveDuration,
      easing: EASE_OUT,
      composite: 'add', // so a shift mid-slide adds to the one still running
    });
  });
  observer.observe(parent);
  observer.observe(element);
  return { destroy: () => observer.disconnect() };
}
