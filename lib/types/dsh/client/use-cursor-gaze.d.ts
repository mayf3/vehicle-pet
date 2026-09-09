/**
 * Bounded cursor awareness (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-031).
 * While the pointer is inside the recorded proximity radius of the resident
 * and no disabling condition applies, the expression/pose layer translates up
 * to ±4 px toward the cursor through two CSS custom properties updated at
 * most once per animation frame. No React state updates on pointermove; the
 * listener reads only event coordinates (payload- and target-ignored, the
 * same privacy class as the CTR-019 input-recency listener) and computes
 * proximity against the adapter's own element rect. Reduced motion keeps the
 * presentation fully static.
 */
import { type RefObject } from 'react';
/** Proximity radius around the resident figure; frozen for V7. */
export declare const GAZE_PROXIMITY_RADIUS_PX = 160;
/** Maximum translation toward the cursor (CTR-031 bound). */
export declare const GAZE_MAX_OFFSET_PX = 4;
export interface CursorGazeOptions {
    readonly elementRef: RefObject<HTMLElement | null>;
    /** Master switch: false keeps the presentation fully static. */
    readonly enabled: boolean;
    /** Disabling conditions re-evaluated on every render. */
    readonly disabled: boolean;
}
export declare function useCursorGaze({ elementRef, enabled, disabled }: CursorGazeOptions): void;
//# sourceMappingURL=use-cursor-gaze.d.ts.map