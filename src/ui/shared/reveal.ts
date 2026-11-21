import { prefersReducedMotion } from './motion';

let itemToReveal: string | undefined;

/** Scrolls to an item once it appears; it renders only after Firestore reports the write. */
export function revealWhenRendered(id: string): void {
  itemToReveal = id;
}

export function revealIfRequested(node: HTMLElement, id: string): void {
  if (id !== itemToReveal) return;
  itemToReveal = undefined;
  requestAnimationFrame(() => node.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
}
