/** Test-build-only resource ledger surfaced to real pinned-Harness Playwright. */

interface E2ERoot {
  pluginResources?: {
    readonly generation: string
    readonly resources: Record<string, number>
  }
  progress?: unknown
}

interface E2EGlobal {
  __vehiclePetE2E?: E2ERoot
}

export interface E2EResourceLedger {
  readonly enabled: boolean
  track(category: string): () => void
}

export function createE2EResourceLedger(generation: string): E2EResourceLedger {
  const enabled = generation.startsWith('e2e-r3-')
  if (!enabled || typeof window === 'undefined') return { enabled: false, track: () => () => {} }

  const target = window as unknown as E2EGlobal
  const root = target.__vehiclePetE2E ?? {}
  target.__vehiclePetE2E = root
  const resources: Record<string, number> = {}
  root.pluginResources = { generation, resources }

  return {
    enabled: true,
    track(category) {
      resources[category] = (resources[category] ?? 0) + 1
      let active = true
      return () => {
        if (!active) return
        active = false
        resources[category] = Math.max(0, (resources[category] ?? 0) - 1)
      }
    },
  }
}
