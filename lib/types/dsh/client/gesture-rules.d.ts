/**
 * Deterministic gesture arbitration for the resident pointer session
 * (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-029). One pure state model owns the
 * click / double-click / long-press petting / drag split; the React layer only
 * feeds events and applies verdicts. Thresholds are named constants recorded
 * here; the double-click window mirrors the pre-V7 native handler so existing
 * settings behavior is preserved (CTR-005).
 */
export declare const GESTURE_DRAG_THRESHOLD_PX = 4;
/** Long-press petting hold; V7 band 400–800 ms, frozen at 550 ms. */
export declare const GESTURE_PETTING_HOLD_MS = 550;
/** Double-click window for the synthetic arbiter (ms). */
export declare const GESTURE_DOUBLE_CLICK_MS = 500;
export type GesturePhase = 'idle' | 'pressed' | 'dragged' | 'petting' | 'petting-release' | 'drop';
export interface GesturePoint {
    readonly x: number;
    readonly y: number;
}
export interface GestureState {
    readonly phase: GesturePhase;
    /** Press origin in page coordinates. */
    readonly origin: GesturePoint | null;
    /** Epoch ms of the most recent pointerdown that started this session. */
    readonly pressedAt: number | null;
    /** Epoch ms of the last completed click (double-click detection). */
    readonly lastClickAt: number | null;
    /** True while a petting hold is active (suppresses click/dblclick paths). */
    readonly petting: boolean;
}
export declare const INITIAL_GESTURE_STATE: GestureState;
export interface GestureInputEvent {
    readonly type: 'press' | 'move' | 'release' | 'cancel';
    readonly at: number;
    readonly point?: GesturePoint;
}
export type GestureVerdict = {
    readonly kind: 'none';
} | {
    readonly kind: 'click';
    readonly doubleClick: boolean;
} | {
    readonly kind: 'petting-start';
} | {
    readonly kind: 'petting-release';
} | {
    readonly kind: 'drag-start';
} | {
    readonly kind: 'drop';
} | {
    readonly kind: 'cancel';
};
/**
 * Pure transition step. Movement beyond the drag threshold routes to DRAGGED
 * at any time (a petting hold can still become a drag while the button is
 * held); release before the hold threshold with no movement is a click; once
 * the hold threshold starts petting, the click path is suppressed for that
 * press entirely; a drop settles without any click verdict.
 */
export declare function reduceGesture(state: GestureState, event: GestureInputEvent): {
    readonly state: GestureState;
    readonly verdict: GestureVerdict;
};
/** True when a press that began at `pressedAt` has held long enough to pet. */
export declare function isPettingHoldDue(state: GestureState, now: number): boolean;
/** Promotion of a pressed session into the petting phase. */
export declare function promoteToPetting(state: GestureState): {
    state: GestureState;
    verdict: GestureVerdict;
};
//# sourceMappingURL=gesture-rules.d.ts.map