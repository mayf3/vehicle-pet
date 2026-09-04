/**
 * Production Progress Source registration for the DSH overlay
 * (DSH_USAGE_PROGRESS_SOURCE_V1, CTR-USG-001): exactly one real source,
 * `DshUsageProgressSource` (`dsh-usage` / `companion`), fed by the injected
 * sessions service's counts-only `tokenUsage` projections. The
 * `MockProgressSource` is never registered here — it remains the prototype,
 * unit/contract-test, and E2E-fixture source (the pinned-Harness E2E build
 * swaps this module for the test fixture via the build alias). Missing
 * sessions wiring degrades to the same silent zero-progress source
 * (CTR-USG-010), never to the mock.
 */

import type { ProgressSource } from '../../engine'
import {
  DshUsageProgressSource,
  type UsageSessionsSource,
} from './usage-progress-source'

export interface OverlayProgressDeps {
  /** Injected `ctx.sessions` face; absence degrades silently (CTR-USG-010). */
  readonly sessions?: UsageSessionsSource
}

export interface OverlayProgressRuntime {
  readonly source: ProgressSource
  dispose(): void
}

export function createOverlayProgressSource(deps: OverlayProgressDeps = {}): OverlayProgressRuntime {
  // CTR-USG-009: the production ledger persists in the versioned
  // browser-local record; every failure path inside the source degrades to
  // memory silently.
  const source = new DshUsageProgressSource({
    storage: {
      getItem: (key) => {
        try {
          return globalThis.localStorage?.getItem(key) ?? null
        } catch {
          return null
        }
      },
      setItem: (key, value) => {
        try {
          globalThis.localStorage?.setItem(key, value)
        } catch {
          // quota/unavailable: memory-only for this session (CTR-USG-010)
        }
      },
    },
  })
  const sessions = deps.sessions
  if (!sessions) return { source, dispose: () => source.dispose() }
  const unsubscribe = sessions.list.subscribe(() => {
    source.observe(sessions.list.getSnapshot())
  })
  return {
    source,
    dispose() {
      unsubscribe()
      source.dispose()
    },
  }
}
