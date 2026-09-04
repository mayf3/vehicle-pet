/**
 * Pinned-Harness E2E-only progress controller; never included in production.
 * DSH_USAGE_PROGRESS_SOURCE_V1 (CTR-USG-001): the E2E progress fixture keeps
 * `MockProgressSource` so scripted growth stays deterministic; the signature
 * accepts (and ignores) the production deps object.
 */
import type { ProgressSource } from '../../../../src/engine'
import { MockProgressSource } from '../../../../src/prototype/MockProgressSource'

export const OVERLAY_INITIAL_PROGRESS_POINTS = 0

export interface OverlayProgressRuntime {
  readonly source: ProgressSource
  dispose(): void
}

interface E2ERoot {
  progress?: {
    readonly generation: string
    setPoints(points: number): void
    resetSubject(): void
  }
}

export function createOverlayProgressSource(deps?: unknown): OverlayProgressRuntime {
  void deps
  const mock = new MockProgressSource(OVERLAY_INITIAL_PROGRESS_POINTS)
  const source: ProgressSource = {
    sourceId: mock.sourceId,
    subscribe(listener) {
      return mock.subscribe(listener)
    },
  }
  const generation = 'e2e-r3-active-fixture'
  if (typeof window === 'undefined') {
    return { source, dispose() {} }
  }

  const target = window as unknown as { __vehiclePetE2E?: E2ERoot }
  const root = target.__vehiclePetE2E ?? {}
  target.__vehiclePetE2E = root
  const control = {
    generation,
    setPoints(points: number) { mock.setPoints(points) },
    resetSubject() { mock.resetSubject() },
  }
  root.progress = control
  return {
    source,
    dispose() {
      if (root.progress === control) delete root.progress
    },
  }
}
