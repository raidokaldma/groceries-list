import { vibrate } from '../../shared/haptics';

/** Distance from the scroll container's edges where dragging starts to scroll it. */
const AUTOSCROLL_MARGIN = 50;
const MAX_AUTOSCROLL_SPEED = 20;
const MOVE_TOLERANCE = 8;
const CLICK_SUPPRESSION_MS = 450;
/** Set on body while dragging; CSS uses it for the cursor. */
const DRAGGING_CLASS = 'dragging';

export function isDragging(): boolean {
  return document.body.classList.contains(DRAGGING_CLASS);
}

export interface LongPressDragOptions {
  /** Selects the element that is pressed and dragged. */
  handle: string;
  canStart: (handle: HTMLElement) => boolean;
  onHold: (handle: HTMLElement, holding: boolean) => void;
  onStart: (handle: HTMLElement, pointerY: number) => void;
  onMove: (pointerY: number) => void;
  onDrop: () => void;
  scroller: () => HTMLElement;
}

/** Long-press an element, then move it; the scroller scrolls when the pointer nears its edges. */
export function longPressDrag(container: HTMLElement, options: LongPressDragOptions) {
  let hold: { handle: HTMLElement; touched: EventTarget; x: number; y: number; timer: ReturnType<typeof setTimeout> } | undefined;
  let drag: { pointerId: number; pointerY: number; frame: number; touched: EventTarget } | undefined;
  let droppedAt = 0;

  function cancelHold() {
    if (!hold) return;
    clearTimeout(hold.timer);
    options.onHold(hold.handle, false);
    hold = undefined;
  }

  function onPointerDown(event: PointerEvent) {
    const handle = (event.target as Element).closest<HTMLElement>(options.handle);
    if (!handle || !container.contains(handle) || event.button > 0 || drag || !options.canStart(handle)) return;
    const delay = event.pointerType === 'mouse' ? 260 : 400;
    hold = { handle, touched: event.target!, x: event.clientX, y: event.clientY, timer: setTimeout(() => start(event.pointerId), delay) };
    options.onHold(handle, true);
  }

  function start(pointerId: number) {
    if (!hold) return;
    const { handle, touched, y } = hold;
    cancelHold();
    drag = { pointerId, pointerY: y, frame: 0, touched };
    // Touch events keep going to the touched element even after it leaves the page (a row moved to another department
    // is recreated), and from there they no longer reach document. Unblocked, Chrome takes the touch over as a scroll
    // and cancels the drag.
    touched.addEventListener('touchmove', preventWhileDragging, { passive: false });
    document.body.classList.add(DRAGGING_CLASS);
    vibrate(15);
    options.onStart(handle, y);
    autoscroll();
  }

  function onPointerMove(event: PointerEvent) {
    if (hold && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > MOVE_TOLERANCE) cancelHold();
    if (drag && event.pointerId === drag.pointerId) {
      drag.pointerY = event.clientY;
      options.onMove(drag.pointerY);
    }
  }

  function onPointerUp(event: PointerEvent) {
    cancelHold();
    if (!drag || event.pointerId !== drag.pointerId) return;
    cancelAnimationFrame(drag.frame);
    drag.touched.removeEventListener('touchmove', preventWhileDragging);
    drag = undefined;
    droppedAt = Date.now();
    document.body.classList.remove(DRAGGING_CLASS);
    options.onDrop();
  }

  function autoscroll() {
    if (!drag) return;
    const scroller = options.scroller();
    const { top, bottom } = scroller.getBoundingClientRect();
    const y = drag.pointerY;
    const speed = y < top + AUTOSCROLL_MARGIN ? (y - top - AUTOSCROLL_MARGIN) / 3 : y > bottom - AUTOSCROLL_MARGIN ? (y - bottom + AUTOSCROLL_MARGIN) / 3 : 0;
    if (speed) {
      scroller.scrollBy(0, Math.max(-MAX_AUTOSCROLL_SPEED, Math.min(MAX_AUTOSCROLL_SPEED, speed)));
      options.onMove(y);
    }
    drag.frame = requestAnimationFrame(autoscroll);
  }

  const preventWhileDragging = (event: Event) => drag && event.preventDefault();
  const preventContextMenu = (event: Event) => (drag || hold) && event.preventDefault();
  // The pointer release after a drag would otherwise click whatever is under it.
  const suppressClickAfterDrop = (event: Event) => {
    if (Date.now() - droppedAt < CLICK_SUPPRESSION_MS) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const listeners = new AbortController();
  const { signal } = listeners;
  container.addEventListener('pointerdown', onPointerDown, { signal });
  addEventListener('pointermove', onPointerMove, { passive: true, signal });
  addEventListener('pointerup', onPointerUp, { signal });
  addEventListener('pointercancel', onPointerUp, { signal });
  document.addEventListener('touchmove', preventWhileDragging, { passive: false, signal });
  document.addEventListener('contextmenu', preventContextMenu, { signal });
  document.addEventListener('click', suppressClickAfterDrop, { capture: true, signal });

  return {
    destroy() {
      cancelHold();
      if (drag) {
        cancelAnimationFrame(drag.frame);
        drag.touched.removeEventListener('touchmove', preventWhileDragging);
      }
      listeners.abort();
    },
  };
}
