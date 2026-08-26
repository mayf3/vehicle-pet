/**
 * Zero-progress placeholder Progress Source for the V1 overlay (CTR-OVERLAY-013).
 * Reuses the repository's single MockProgressSource implementation (initial
 * points 0), but exports only the subscribe surface. The overlay cannot mutate
 * progress or reset a subject and persists nothing authoritative.
 */

import type { ProgressSource } from '../../engine'
import { MockProgressSource } from '../../prototype/MockProgressSource'

export const OVERLAY_INITIAL_PROGRESS_POINTS = 0

export interface OverlayProgressRuntime {
  readonly source: ProgressSource
  dispose(): void
}

export function createOverlayProgressSource(_clientGeneration?: string): OverlayProgressRuntime {
  const mock = new MockProgressSource(OVERLAY_INITIAL_PROGRESS_POINTS)
  return {
    source: {
      sourceId: mock.sourceId,
      subscribe(listener) {
        return mock.subscribe(listener)
      },
    },
    dispose() {},
  }
}
