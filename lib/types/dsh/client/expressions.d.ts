/**
 * Session-expression presentation for the resident pet
 * (DSH_PET_OVERLAY_ADAPTER_V3 DEC-OVERLAY-007 / CTR-OVERLAY-014/015).
 *
 * The layer is adapter-owned presentation: ten transparent variant masters —
 * the five structured session states plus five companion sub-expression
 * variants (bundled, deterministic, WebP primary + PNG fallback) — positioned
 * over the current level sprite through a per-level face anchor table. It is
 * transient session presentation only — it never mutates progression, adds no
 * pointer/focus target, and stays readable with motion suppressed
 * (CTR-OVERLAY-015). Anchors mirror ANCHOR_PX in
 * scripts/generate-expression-assets.mjs (480x480 sprite canvas percentages).
 */
import type { VehiclePetSessionView } from './types';
/**
 * The expression variants (V3 CTR-OVERLAY-014): the five structured states
 * keep their mapping duty; the additional variants cover happy, curious,
 * resting, a second completed family member, and a relaxed cancelled family
 * member. Ten statically distinguishable masters exceed the eight floor.
 */
export type VehiclePetExpressionVariant = 'idle' | 'idle-happy' | 'idle-curious' | 'idle-sleepy' | 'working' | 'needs-input' | 'completed' | 'completed-proud' | 'failed' | 'cancelled';
/**
 * Face anchor rects `[left, top, size]` in % of the 480x480 level sprite
 * canvas are per-pet presentation data (V8 CTR-OVERLAY-038): the bundled
 * vehicle reference carries them in `pets/vehicle/definition.ts`.
 */
/** The five user-perceivable session states (mapping core, unchanged from V2). */
export type VehiclePetExpressionState = 'idle' | 'working' | 'needs-input' | 'completed' | 'failed';
/**
 * Structured session view → expression state. failed and cancelled share the
 * comforting failed presentation (§8.3); completed, working, and needs-input
 * map one-to-one; idle is the calm baseline.
 */
export declare function expressionStateFromSession(session: VehiclePetSessionView): VehiclePetExpressionState;
/** Anchor lookup over a pet's own expression anchor table (generic). */
export declare function expressionAnchor(anchors: Readonly<Record<string, readonly [number, number, number]>>, levelId: string | undefined): readonly [number, number, number] | null;
export declare function expressionAsset(variant: VehiclePetExpressionVariant): {
    webp: string;
    png: string;
} | null;
/** Structured context driving the pure variant selection (unit-testable). */
export interface ExpressionSelectionContext {
    /** Mapped five-state session state. */
    readonly state: VehiclePetExpressionState;
    /** Terminal status when a terminal reaction is active (cancelled → relaxed). */
    readonly terminalStatus: 'completed' | 'failed' | 'cancelled' | null;
    /** True when a level-up / milestone event is currently being celebrated. */
    readonly milestoneActive: boolean;
    /** Increments on each pet click; drives the idle variant cycle. */
    readonly clickCount: number;
    /**
     * Bounded idle bucket: 0 fresh (≤2 min), 1 mid (≤10 min), 2 long (>10 min).
     * Derived from payload-ignored activity recency; deterministic input.
     */
    readonly idleBucket: 0 | 1 | 2;
    /** The most recently rendered variant for the same state (no-immediate-repeat). */
    readonly lastVariantForState: VehiclePetExpressionVariant | undefined;
    /**
     * V7 CTR-034: device-local late-night bucket raises the sleepy tendency at
     * mid-idle; pure weight input, never gates a mapped state.
     */
    readonly daypartSleepy?: boolean;
}
/**
 * Pure variant selection (V3 CTR-OVERLAY-014): deterministic over structured
 * context, no immediate repetition of the same variant within the same state.
 */
export declare function selectExpressionVariant(context: ExpressionSelectionContext): VehiclePetExpressionVariant;
//# sourceMappingURL=expressions.d.ts.map