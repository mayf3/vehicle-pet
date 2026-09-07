/**
 * Shared DSH adapter types (CTR-OVERLAY-002..013).
 * Only `src/dsh/**` may import DeepSeek Harness contracts; these local
 * structural types keep the adapter testable without any DSH value import.
 */
/** Transient live Harness session presentation for the pet overlay. */
export type VehiclePetLiveState = 'idle' | 'running' | 'needs-input';
/** One edge-deduplicated terminal turn reaction (visual-only). */
export interface VehiclePetTerminalReaction {
    /** Deterministic identity: `sessionId#turn#turnEndSeq`. Stable across reload. */
    readonly identity: string;
    readonly status: 'completed' | 'failed' | 'cancelled';
}
/** The overlay's whole view of structured Harness session state. */
export interface VehiclePetSessionView {
    readonly live: VehiclePetLiveState;
    readonly terminal: VehiclePetTerminalReaction | null;
}
/** Versioned browser-local overlay preference record (CTR-OVERLAY-010). */
export interface VehiclePetOverlayPreferences {
    readonly schemaVersion: 1;
    readonly position: {
        readonly xRatio: number;
        readonly yRatio: number;
    };
    /** False until the first pointer drag or keyboard move. */
    readonly positionCustomized: boolean;
    readonly collapsed: boolean;
    /** Explicit reduced-motion choice; absent means "follow the system". */
    readonly reducedMotion: boolean | undefined;
}
/** The three persisted interaction states of the overlay (CTR-OVERLAY-004). */
export type VehiclePetInteractionState = 'VISIBLE' | 'PANEL_OPEN';
/** Fixed overlay geometry (CTR-OVERLAY-003, CTR-OVERLAY-004, CTR-OVERLAY-005). */
export declare const OVERLAY_GEOMETRY: {
    readonly visibleSizePx: 112;
    readonly collapsedLauncherSizePx: 36;
    readonly compactPanelWidthPx: 264;
    readonly viewportMarginPx: 16;
    /** Deterministic composer-safe default; customized ratios do not use it. */
    readonly defaultBottomSafeInsetPx: 176;
};
//# sourceMappingURL=types.d.ts.map