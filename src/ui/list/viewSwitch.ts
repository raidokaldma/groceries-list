import { EASE_OUT, prefersReducedMotion } from '../shared/motion';

/** Fades the list out, swaps its content, then fades the new sections up one after another. */
export async function fadeSwap(listElement: HTMLElement, swap: () => Promise<void>): Promise<void> {
  if (prefersReducedMotion()) return swap();
  const fadeOut = listElement.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], {
    duration: 140,
    easing: 'ease-in',
    fill: 'forwards',
  });
  await fadeOut.finished;
  await swap();
  fadeOut.cancel();
  [...listElement.children].forEach((child, i) =>
    child.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
      duration: 320,
      delay: i * 45,
      easing: EASE_OUT,
      fill: 'backwards',
    }),
  );
}
