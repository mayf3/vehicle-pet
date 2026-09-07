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

import { expressionAssets } from './expression-assets.generated'
import type { VehiclePetSessionView } from './types'

/** The five user-perceivable expression states (V2 §8 EXPRESSION_STATES). */
export type VehiclePetExpressionState =
  | 'idle'
  | 'working'
  | 'needs-input'
  | 'completed'
  | 'failed'

/** Face anchor rects `[left, top, size]` in % of the 480x480 level sprite canvas. */
export const EXPRESSION_LEVEL_ANCHORS: Readonly<
  Record<string, readonly [number, number, number]>
> = {
  l1: [8, 43, 28],
  l2: [12, 42, 32],
  l3: [9, 42, 28],
  l4: [12, 44, 32],
  l5: [10, 53, 30],
  l6: [29, 53, 27],
  l7: [43, 66, 23],
  l8: [51, 67, 23],
  l9: [26, 63, 27],
  l10: [28, 62, 24],
  l11: [22, 62, 24],
  l12: [8, 59, 26],
}

/**
 * Structured session view → expression state. failed and cancelled share the
 * comforting failed presentation (V2 §8.3); completed, working, and
 * needs-input map one-to-one; idle is the calm baseline.
 */
export function expressionStateFromSession(
  session: VehiclePetSessionView,
): VehiclePetExpressionState {
  if (session.terminal !== null) {
    return session.terminal.status === 'completed' ? 'completed' : 'failed'
  }
  if (session.live === 'running') return 'working'
  if (session.live === 'needs-input') return 'needs-input'
  return 'idle'
}

export function expressionAnchor(
  levelId: string | undefined,
): readonly [number, number, number] | null {
  if (levelId === undefined) return null
  return EXPRESSION_LEVEL_ANCHORS[levelId] ?? null
}

export function expressionAsset(
  state: VehiclePetExpressionState,
): { webp: string; png: string } | null {
  return expressionAssets[state] ?? null
}
