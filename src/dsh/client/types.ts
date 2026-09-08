/**
 * Shared DSH adapter types (DSH_PET_OVERLAY_ADAPTER_V3).
 * Only `src/dsh/**` may import DeepSeek Harness contracts; these local
 * structural types keep the adapter testable without any DSH value import.
 */

/** Transient live Harness session presentation for the pet overlay. */
export type VehiclePetLiveState = 'idle' | 'running' | 'needs-input'

/** One edge-deduplicated terminal turn reaction (visual-only). */
export interface VehiclePetTerminalReaction {
  /** Deterministic identity: `sessionId#turn#turnEndSeq`. Stable across reload. */
  readonly identity: string
  readonly status: 'completed' | 'failed' | 'cancelled'
}

/** The overlay's whole view of structured Harness session state. */
export interface VehiclePetSessionView {
  readonly live: VehiclePetLiveState
  readonly terminal: VehiclePetTerminalReaction | null
}

/** The two resident sizes (V3 CTR-OVERLAY-020); absent choice resolves LARGE. */
export type VehiclePetSize = 'small' | 'large'

/** Versioned browser-local overlay preference record (V3 CTR-OVERLAY-010). */
export interface VehiclePetOverlayPreferences {
  readonly schemaVersion: 1
  readonly position: { readonly xRatio: number; readonly yRatio: number }
  /** False until the first pointer drag or keyboard move. */
  readonly positionCustomized: boolean
  readonly collapsed: boolean
  /** Explicit reduced-motion choice; absent means "follow the system". */
  readonly reducedMotion: boolean | undefined
  /** Explicit size choice; absent resolves to LARGE (V3 DEC-OVERLAY-005). */
  readonly size: VehiclePetSize | undefined
}

/**
 * The persisted interaction machine is exactly VISIBLE with a collapsed
 * browser-local preference (V3 CTR-OVERLAY-004): PANEL_OPEN no longer exists.
 * The value names the rendered resident surface for tests and a11y tooling.
 */
export type VehiclePetInteractionState = 'VISIBLE'

/** Fixed overlay geometry (V3 CTR-OVERLAY-003/004/005/016/020). */
export const OVERLAY_GEOMETRY = {
  smallSurfaceHeightPx: 112,
  largeSurfaceHeightPx: 216,
  collapsedLauncherSizePx: 36,
  secondaryMenuWidthPx: 216,
  viewportMarginPx: 16,
  /** Deterministic composer-safe default for SMALL; customized ratios do not use it. */
  smallDefaultBottomSafeInsetPx: 176,
  /**
   * LARGE default clears the recorded coexistence footprint of a co-installed
   * deepseek-pet overlay in its default bottom-right region (census-measured
   * 306x372 root + margin; no runtime DOM reading of any other plugin).
   */
  largeDefaultBottomSafeInsetPx: 392,
  /** Pointer/focus hitboxes hug the visible sprite within this tolerance. */
  hitboxTolerancePx: 8,
} as const

/** Effective size for a preference record: absent choice resolves LARGE. */
export function effectiveSize(preferences: Pick<VehiclePetOverlayPreferences, 'size'>): VehiclePetSize {
  return preferences.size ?? 'large'
}

/** Rendered surface edge length for the effective interaction state. */
export function residentSurfaceSizePx(collapsed: boolean, size: VehiclePetSize): number {
  if (collapsed) return OVERLAY_GEOMETRY.collapsedLauncherSizePx
  return size === 'small'
    ? OVERLAY_GEOMETRY.smallSurfaceHeightPx
    : OVERLAY_GEOMETRY.largeSurfaceHeightPx
}
