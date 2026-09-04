/**
 * Production Progress Source for the DSH overlay: the exactly-one real source
 * authorized by DSH_USAGE_PROGRESS_SOURCE_V1 (CTR-USG-001). Converts
 * counts-only `tokenUsage` projection growth into monotone
 * ProgressSnapshotV1 emissions; it cannot reset a subject and persists
 * nothing authoritative. The pinned-Harness E2E build swaps this module for
 * the mock-backed fixture (tests/dsh/e2e/fixtures/OverlayProgressSource.e2e);
 * the prototype shell keeps the plain MockProgressSource.
 */

import type { ProgressSource } from '../../engine'
import { DshUsageProgressSource, type UsageSessionListLike } from './UsageProgressSource'

export { USAGE_SOURCE_ID, USAGE_SUBJECT_ID } from './usage-economy'

export interface OverlayProgressRuntime {
  readonly source: ProgressSource
  /** Structured session-list feed; absent in the E2E mock fixture. */
  observe?(list: UsageSessionListLike): void
  dispose(): void
}

export function createOverlayProgressSource(_clientGeneration?: string): OverlayProgressRuntime {
  const usage = new DshUsageProgressSource()
  return {
    source: usage,
    observe: (list: UsageSessionListLike) => {
      usage.observe(list)
    },
    dispose() {
      usage.dispose()
    },
  }
}
