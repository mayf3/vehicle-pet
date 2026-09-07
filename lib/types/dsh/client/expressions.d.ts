/**
 * Session-expression presentation for the resident pet
 * (DSH_PET_OVERLAY_ADAPTER_V2 DEC-OVERLAY-007 / CTR-OVERLAY-014/015).
 *
 * The layer is adapter-owned presentation: five transparent state masters
 * (bundled, deterministic, WebP primary + PNG fallback) are positioned over
 * the current level sprite through a per-level face anchor table. It is
 * transient session presentation only — it never mutates progression, adds no
 * pointer/focus target, and stays readable with motion suppressed
 * (CTR-OVERLAY-015). Anchors mirror ANCHOR_PX in
 * scripts/generate-expression-assets.mjs (480x480 sprite canvas percentages).
 */
import type { VehiclePetSessionView } from './types';
/** The five user-perceivable expression states (V2 §8 EXPRESSION_STATES). */
export type VehiclePetExpressionState = 'idle' | 'working' | 'needs-input' | 'completed' | 'failed';
/** Face anchor rects `[left, top, size]` in % of the 480x480 level sprite canvas. */
export declare const EXPRESSION_LEVEL_ANCHORS: Readonly<Record<string, readonly [number, number, number]>>;
/**
 * Structured session view → expression state. failed and cancelled share the
 * comforting failed presentation (V2 §8.3); completed, working, and
 * needs-input map one-to-one; idle is the calm baseline.
 */
export declare function expressionStateFromSession(session: VehiclePetSessionView): VehiclePetExpressionState;
export declare function expressionAnchor(levelId: string | undefined): readonly [number, number, number] | null;
export declare function expressionAsset(state: VehiclePetExpressionState): {
    webp: string;
    png: string;
} | null;
//# sourceMappingURL=expressions.d.ts.map