import { EASE_OUT, prefersReducedMotion } from '../shared/motion';
import { layoutTop } from './dragPlacement';
import { dragMoveDuration } from './transitions';

/** Folding in reverse: the departments slide apart to make room, then their rows fade in. */
export async function unfoldSmoothly(listElement: HTMLElement, unfold: () => Promise<void>): Promise<void> {
  const sections = [...listElement.querySelectorAll<HTMLElement>('.grp')];
  const foldedTops = new Map(sections.map((section) => [section, layoutTop(section)]));
  await unfold();
  if (prefersReducedMotion()) return;
  for (const section of sections) {
    const shift = foldedTops.get(section)! - layoutTop(section);
    if (shift) section.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], { duration: dragMoveDuration, easing: EASE_OUT });
    section.querySelector('.card')?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: dragMoveDuration * 2 });
  }
}
