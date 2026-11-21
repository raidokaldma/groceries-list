const START_DISTANCE = 6;
const CLOSE_FRACTION = 0.28;
/** A quick flick closes even if short, as long as it moved this far. */
const FLICK_MIN_DISTANCE = 40;
const FLICK_SPEED = 0.5; // px per ms

/** Drag the sheet down to close it: from the grab handle, or from anywhere when its content is scrolled to the top. */
export function dragToClose(panel: HTMLElement, options: { backdrop: () => HTMLElement; onClose: () => void }) {
  let startY: number | undefined;
  let distance = 0;
  let startedAt = 0;
  let dragging = false;

  function start(y: number) {
    startY = y;
    distance = 0;
    startedAt = Date.now();
    dragging = false;
  }

  function move(y: number, event: Event) {
    if (startY === undefined) return;
    const delta = y - startY;
    if (!dragging) {
      const fromHandle = (event.target as Element).closest('.grab');
      if (delta > START_DISTANCE && (panel.scrollTop <= 0 || fromHandle)) {
        dragging = true;
        panel.style.transition = 'none';
        (document.activeElement as HTMLElement | null)?.blur();
      } else {
        if (Math.abs(delta) > START_DISTANCE) startY = undefined;
        return;
      }
    }
    if (event.cancelable) event.preventDefault();
    distance = Math.max(0, delta);
    panel.style.transform = `translateY(${distance}px)`;
    options.backdrop().style.background = `rgba(8,14,10,${(0.42 * Math.max(0, 1 - distance / panel.offsetHeight)).toFixed(3)})`;
  }

  function end(): boolean {
    startY = undefined;
    if (!dragging) return false;
    dragging = false;
    panel.style.transition = '';
    panel.style.transform = '';
    options.backdrop().style.background = '';
    if (distance > panel.offsetHeight * CLOSE_FRACTION || (distance > FLICK_MIN_DISTANCE && distance / (Date.now() - startedAt) > FLICK_SPEED)) options.onClose();
    return true;
  }

  const onTouchStart = (event: TouchEvent) => event.touches.length === 1 && start(event.touches[0].clientY);
  const onTouchMove = (event: TouchEvent) => move(event.touches[0].clientY, event);
  const onTouchEnd = () => end();
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !(event.target as Element).closest('.grab')) return;
    start(event.clientY);
    (event.target as Element).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => event.pointerType === 'mouse' && move(event.clientY, event);
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !end()) return;
    // A mouse drag on the handle would otherwise click it, and the handle closes the sheet.
    (event.target as Element).closest('.grab')?.addEventListener('click', (click) => click.stopPropagation(), { once: true, capture: true });
  };

  const listeners = new AbortController();
  const { signal } = listeners;
  panel.addEventListener('touchstart', onTouchStart, { passive: true, signal });
  panel.addEventListener('touchmove', onTouchMove, { passive: false, signal });
  panel.addEventListener('touchend', onTouchEnd, { signal });
  panel.addEventListener('touchcancel', onTouchEnd, { signal });
  panel.addEventListener('pointerdown', onPointerDown, { signal });
  panel.addEventListener('pointermove', onPointerMove, { signal });
  panel.addEventListener('pointerup', onPointerUp, { signal });

  return { destroy: () => listeners.abort() };
}
