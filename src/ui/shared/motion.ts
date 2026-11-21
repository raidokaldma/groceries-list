/** The app's standard ease-out, matching --ease in app.css. */
export const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
