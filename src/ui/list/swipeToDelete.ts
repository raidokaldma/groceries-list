import { vibrate } from '../../shared/haptics';
import { isDragging } from './longPressDrag';

/** Movement needed before the gesture decides between a sideways swipe and a vertical scroll. */
const DECIDE_DISTANCE = 10;
/** A swipe must be clearly more sideways than vertical. */
const HORIZONTAL_RATIO = 1.5;
/** Where the row sits when letting go would delete, as a fraction of its width. */
const DELETE_FRACTION = 0.35;
/** The finger must travel this many times further than the row to reach the delete point: it feels heavier. */
const RESISTANCE = 1.4;
/** How close to the delete point the resisting row gets before it snaps over. */
const BEFORE_SNAP = 0.85;
/** Past the delete point the row moves faster than the finger: it feels lighter. */
const EASY_FOLLOW = 1.2;
const SNAP_MS = 120;
/** A quick flick deletes even if short, as long as it moved this far. */
const FLICK_MIN_DISTANCE = 40;
const FLICK_SPEED = 0.6; // px per ms
const SLIDE_MS = 200;
const CLICK_SUPPRESSION_MS = 400;

interface Swipe {
  phase: 'deciding' | 'swiping';
  row: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  fingerDistance: number;
  /** Past the delete threshold: letting go now deletes. */
  armed: boolean;
}

/** Swipe a row left to delete it; a short swipe slides it back. Rows need a data-id. */
export function swipeToDelete(container: HTMLElement, options: { onDelete: (id: string) => void }) {
  let swipe: Swipe | undefined;
  let swipedAt = 0;

  function onPointerDown(event: PointerEvent) {
    const row = (event.target as Element).closest<HTMLElement>('.row[data-id]');
    if (!row || !container.contains(row) || event.button > 0 || isDragging()) return;
    swipe = { phase: 'deciding', row, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startedAt: event.timeStamp, fingerDistance: 0, armed: false };
  }

  function onPointerMove(event: PointerEvent) {
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    if (swipe.phase === 'deciding') {
      if (Math.hypot(dx, dy) < DECIDE_DISTANCE) return;
      const isLeftSwipe = dx < 0 && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_RATIO;
      if (!isLeftSwipe || isDragging()) {
        swipe = undefined;
        return;
      }
      swipe.phase = 'swiping';
      swipe.row.classList.add('swiping');
    }
    swipe.fingerDistance = Math.max(0, -dx);
    const { distance, armed } = rowTravel(swipe.fingerDistance, swipe.row.offsetWidth);
    if (armed !== swipe.armed) {
      swipe.armed = armed;
      snap(swipe.row);
      // Signal the moment letting go would delete; swiping back and forth signals again.
      if (armed) vibrate(15);
    }
    swipe.row.style.setProperty('--swipe', `${-distance}px`);
  }

  function onPointerEnd(event: PointerEvent) {
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    const { phase, row, fingerDistance, startedAt, armed } = swipe;
    swipe = undefined;
    if (phase !== 'swiping') return;
    swipedAt = Date.now();
    const flicked = fingerDistance > FLICK_MIN_DISTANCE && fingerDistance / (event.timeStamp - startedAt) > FLICK_SPEED;
    const deletes = event.type === 'pointerup' && (armed || flicked);
    if (deletes) slide(row, -row.offsetWidth, () => options.onDelete(row.dataset.id!));
    else slide(row, 0, () => row.classList.remove('swiping'));
  }

  // The release after a swipe would otherwise click the row's buttons.
  function suppressClickAfterSwipe(event: Event) {
    if (Date.now() - swipedAt < CLICK_SUPPRESSION_MS) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  const listeners = new AbortController();
  const { signal } = listeners;
  container.addEventListener('pointerdown', onPointerDown, { signal });
  addEventListener('pointermove', onPointerMove, { passive: true, signal });
  addEventListener('pointerup', onPointerEnd, { signal });
  addEventListener('pointercancel', onPointerEnd, { signal });
  container.addEventListener('click', suppressClickAfterSwipe, { capture: true, signal });

  return { destroy: () => listeners.abort() };
}

/**
 * How far the row moves for a given finger travel. It resists up to the delete point, then jumps over it
 * and follows faster, so the delete point feels like a notch.
 */
function rowTravel(fingerDistance: number, rowWidth: number): { distance: number; armed: boolean } {
  const deletePoint = rowWidth * DELETE_FRACTION;
  const fingerDeletePoint = deletePoint * RESISTANCE;
  if (fingerDistance < fingerDeletePoint) {
    return { distance: (fingerDistance / fingerDeletePoint) * deletePoint * BEFORE_SNAP, armed: false };
  }
  return { distance: Math.min(rowWidth, deletePoint + (fingerDistance - fingerDeletePoint) * EASY_FOLLOW), armed: true };
}

/** Animates the jump across the delete point instead of letting the row teleport. */
function snap(row: HTMLElement) {
  row.classList.add('swipe-snapping');
  setTimeout(() => row.classList.remove('swipe-snapping'), SNAP_MS);
}

function slide(row: HTMLElement, offset: number, then: () => void) {
  row.classList.add('swipe-settling');
  row.style.setProperty('--swipe', `${offset}px`);
  setTimeout(() => {
    row.classList.remove('swipe-settling');
    then();
  }, SLIDE_MS);
}
