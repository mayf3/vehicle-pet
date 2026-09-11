/**
 * Shared DSH adapter types (DSH_PET_OVERLAY_ADAPTER_V3).
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
/**
 * Open pet id (V8 CTR-OVERLAY-041): any bundled pet presentation id; absent or
 * unknown stored values fail soft to the documented default (`vehicle`) via
 * `pets/bundled.ts resolvePetId`.
 */
export type PetId = string;
export type VehiclePetSize = 'small' | 'large';
/** Versioned browser-local overlay preference record (V3 CTR-OVERLAY-010). */
export interface VehiclePetOverlayPreferences {
    readonly characterId?: PetId;
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
    /** Explicit size choice; absent resolves to LARGE (V3 DEC-OVERLAY-005). */
    readonly size: VehiclePetSize | undefined;
    /**
     * V7 CTR-035/036 ritual fields. Absent/invalid fields silently disable the
     * welcome-back and once-per-day rituals; they never block the pet.
     */
    readonly lastSeenAt?: number;
    readonly rituals?: RitualMarkers;
}
/**
 * Once-per-local-day ritual markers (V7 CTR-OVERLAY-036). No history beyond
 * the current local day markers is ever accumulated.
 */
export interface RitualMarkers {
    readonly dayKey: string | undefined;
    readonly firstCompletionDone: boolean;
    readonly lateNightDone: boolean;
    readonly welcomeDayKey: string | undefined;
}
/**
 * The persisted interaction machine (V3 CTR-OVERLAY-004) has exactly two
 * observable surfaces: `VISIBLE` and `COLLAPSED`. `COLLAPSED` is carried by
 * the collapsed browser-local preference rather than this state value, so
 * the persisted interaction state is the constant 'VISIBLE' and the root
 * element renders data-vehicle-pet = 'VISIBLE' | 'COLLAPSED' from
 * (state, collapsed). PANEL_OPEN no longer exists.
 */
export type VehiclePetInteractionState = 'VISIBLE';
/** Fixed overlay geometry (V3 CTR-OVERLAY-003/004/005/016/020). */
export declare const OVERLAY_GEOMETRY: {
    readonly smallSurfaceHeightPx: 112;
    readonly largeSurfaceHeightPx: 216;
    readonly collapsedLauncherSizePx: 36;
    readonly secondaryMenuWidthPx: 216;
    readonly viewportMarginPx: 16;
    /** Deterministic composer/whale-safe default for SMALL; customized ratios do not use it. */
    readonly smallDefaultBottomSafeInsetPx: 392;
    /**
     * LARGE default clears the recorded coexistence footprint of a co-installed
     * deepseek-pet overlay in its default bottom-right region (census-measured
     * 306x372 root + margin; no runtime DOM reading of any other plugin).
     */
    readonly largeDefaultBottomSafeInsetPx: 392;
    /** Pointer/focus hitboxes hug the visible sprite within this tolerance. */
    readonly hitboxTolerancePx: 8;
};
/** Effective size for a preference record: absent choice resolves LARGE. */
export declare function effectiveSize(preferences: Pick<VehiclePetOverlayPreferences, 'size'>): VehiclePetSize;
/** Rendered surface edge length for the effective interaction state. */
export declare function residentSurfaceSizePx(collapsed: boolean, size: VehiclePetSize): number;
//# sourceMappingURL=types.d.ts.map