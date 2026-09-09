/**
 * Deterministic gesture arbitration for the resident pointer session
 * (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-029). One pure state model owns the
 * click / double-click / long-press petting / drag split; the React layer only
 * feeds events and applies verdicts. Thresholds are named constants recorded
 * here; the double-click window mirrors the pre-V7 native handler so existing
 * settings behavior is preserved (CTR-005).
 */

export const GESTURE_DRAG_THRESHOLD_PX = 4
/** Long-press petting hold; V7 band 400–800 ms, frozen at 550 ms. */
export const GESTURE_PETTING_HOLD_MS = 550
/** Double-click window for the synthetic arbiter (ms). */
export const GESTURE_DOUBLE_CLICK_MS = 500

export type GesturePhase =
  | 'idle'
  | 'pressed'
  | 'dragged'
  | 'petting'
  | 'petting-release'
  | 'drop'

export interface GesturePoint {
  readonly x: number
  readonly y: number
}

export interface GestureState {
  readonly phase: GesturePhase
  /** Press origin in page coordinates. */
  readonly origin: GesturePoint | null
  /** Epoch ms of the most recent pointerdown that started this session. */
  readonly pressedAt: number | null
  /** Epoch ms of the last completed click (double-click detection). */
  readonly lastClickAt: number | null
  /** True while a petting hold is active (suppresses click/dblclick paths). */
  readonly petting: boolean
}

export const INITIAL_GESTURE_STATE: GestureState = {
  phase: 'idle',
  origin: null,
  pressedAt: null,
  lastClickAt: null,
  petting: false,
}

export interface GestureInputEvent {
  readonly type: 'press' | 'move' | 'release' | 'cancel'
  readonly at: number
  readonly point?: GesturePoint
}

export type GestureVerdict =
  | { readonly kind: 'none' }
  | { readonly kind: 'click'; readonly doubleClick: boolean }
  | { readonly kind: 'petting-start' }
  | { readonly kind: 'petting-release' }
  | { readonly kind: 'drag-start' }
  | { readonly kind: 'drop' }
  | { readonly kind: 'cancel' }

const movedPastThreshold = (a: GesturePoint, b: GesturePoint): boolean =>
  Math.hypot(a.x - b.x, a.y - b.y) > GESTURE_DRAG_THRESHOLD_PX

const cleared = (state: GestureState, patch: Partial<GestureState>): GestureState => ({
  ...state,
  phase: 'idle',
  origin: null,
  pressedAt: null,
  petting: false,
  ...patch,
})

/**
 * Pure transition step. Movement beyond the drag threshold routes to DRAGGED
 * at any time (a petting hold can still become a drag while the button is
 * held); release before the hold threshold with no movement is a click; once
 * the hold threshold starts petting, the click path is suppressed for that
 * press entirely; a drop settles without any click verdict.
 */
export function reduceGesture(
  state: GestureState,
  event: GestureInputEvent,
): { readonly state: GestureState; readonly verdict: GestureVerdict } {
  switch (event.type) {
    case 'press': {
      if (state.phase !== 'idle' && state.phase !== 'petting-release' && state.phase !== 'drop') {
        return { state, verdict: { kind: 'none' } }
      }
      return {
        state: { ...state, phase: 'pressed', origin: event.point ?? null, pressedAt: event.at, petting: false },
        verdict: { kind: 'none' },
      }
    }
    case 'move': {
      if ((state.phase !== 'pressed' && state.phase !== 'petting')
        || state.origin === null || event.point === undefined) {
        return { state, verdict: { kind: 'none' } }
      }
      if (movedPastThreshold(state.origin, event.point)) {
        const wasPetting = state.phase === 'petting'
        return {
          state: { ...state, phase: 'dragged', petting: false },
          verdict: wasPetting ? { kind: 'cancel' } : { kind: 'drag-start' },
        }
      }
      return { state, verdict: { kind: 'none' } }
    }
    case 'release': {
      const point = event.point
      if (state.phase === 'pressed' && state.origin !== null
        && (point === undefined || !movedPastThreshold(state.origin, point))) {
        const doubleClick = state.lastClickAt !== null
          && event.at - state.lastClickAt <= GESTURE_DOUBLE_CLICK_MS
        return { state: cleared(state, { lastClickAt: event.at }), verdict: { kind: 'click', doubleClick } }
      }
      if (state.phase === 'petting') {
        return { state: cleared(state, {}), verdict: { kind: 'petting-release' } }
      }
      if (state.phase === 'dragged') {
        return { state: { ...state, phase: 'drop', origin: null, pressedAt: null, petting: false }, verdict: { kind: 'drop' } }
      }
      return { state, verdict: { kind: 'none' } }
    }
    case 'cancel': {
      if (state.phase === 'idle') return { state, verdict: { kind: 'none' } }
      return { state: cleared(state, {}), verdict: { kind: 'cancel' } }
    }
  }
}

/** True when a press that began at `pressedAt` has held long enough to pet. */
export function isPettingHoldDue(state: GestureState, now: number): boolean {
  return state.phase === 'pressed' && state.pressedAt !== null
    && now - state.pressedAt >= GESTURE_PETTING_HOLD_MS
}

/** Promotion of a pressed session into the petting phase. */
export function promoteToPetting(state: GestureState): { state: GestureState; verdict: GestureVerdict } {
  if (state.phase !== 'pressed') return { state, verdict: { kind: 'none' } }
  return { state: { ...state, phase: 'petting', petting: true }, verdict: { kind: 'petting-start' } }
}
