/** Pinned-Harness E2E-only progress controller; never included in production. */
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

export function createOverlayProgressSource(clientGeneration?: string): OverlayProgressRuntime {
  const mock = new MockProgressSource(OVERLAY_INITIAL_PROGRESS_POINTS)
  const source: ProgressSource = {
    sourceId: mock.sourceId,
    subscribe(listener) {
      return mock.subscribe(listener)
    },
  }
  if (clientGeneration?.startsWith('e2e-r3-active-') !== true || typeof window === 'undefined') {
    return { source, dispose() {} }
  }

  const target = window as unknown as { __vehiclePetE2E?: E2ERoot }
  const root = target.__vehiclePetE2E ?? {}
  target.__vehiclePetE2E = root
  const control = {
    generation: clientGeneration,
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
