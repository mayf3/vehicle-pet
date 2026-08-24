/**
 * Zero-progress placeholder Progress Source for the V1 overlay (CTR-OVERLAY-013).
 * Reuses the repository's single MockProgressSource implementation (initial
 * points 0). The overlay never calls addPoints/setPoints/resetSubject; this
 * wrapper exposes only the subscribe surface so that boundary is structural.
 * It is NOT a DSH Progress Source and persists nothing authoritative.
 */

import type { ProgressSource } from '../../engine'
import { MockProgressSource } from '../../prototype/MockProgressSource'

export const OVERLAY_INITIAL_PROGRESS_POINTS = 0

export function createOverlayProgressSource(): ProgressSource {
  const mock = new MockProgressSource(OVERLAY_INITIAL_PROGRESS_POINTS)
  return {
    sourceId: mock.sourceId,
    subscribe(listener) {
      return mock.subscribe(listener)
    },
  }
}
