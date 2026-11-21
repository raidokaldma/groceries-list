/**
 * iOS doesn't shrink the page when the on-screen keyboard opens; it overlays it and may shift the visible area.
 * Exposes the visible area's height and offset, so the app shell can cover exactly that.
 * Where the keyboard resizes the page instead (Android), these match the page.
 */
export function fitToVisibleArea(): void {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const root = document.documentElement;
  function update() {
    root.style.setProperty('--visible-height', `${viewport!.height}px`);
    root.style.setProperty('--visible-top', `${viewport!.offsetTop}px`);
  }
  viewport.addEventListener('resize', update);
  viewport.addEventListener('scroll', update);
  update();
}

/** Exposes an element's height as a CSS variable on the root, for spacing around fixed bars. */
export function exposeHeight(element: HTMLElement, variable: string) {
  const observer = new ResizeObserver(() => document.documentElement.style.setProperty(variable, `${element.offsetHeight}px`));
  observer.observe(element);
  return { destroy: () => observer.disconnect() };
}
