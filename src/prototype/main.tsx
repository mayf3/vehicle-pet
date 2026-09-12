/**
 * Prototype shell entrypoint. URL parameters:
 *   ?showcase=1                       static multi-state showcase
 *   ?dev=1                            local prototype controls and diagnostics
 *   ?pack=<bundled packId>            selects the initial persisted active Pack
 *   ?points=<safe integer>            initial MockProgressSource points
 *   ?reducedMotion=1                  start with reduced motion on
 */

import { createRoot } from 'react-dom/client'
import { IndexedDbPetStorage } from '../engine'
import { bundledPackBundles } from '../packs/bundledRegistry'
import { App } from './App'
import { MockProgressSource } from './MockProgressSource'

function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

async function bootstrap() {
  const params = readParams()
  const initialPoints = Number.parseInt(params.get('points') ?? '0', 10)
  const source = new MockProgressSource(Number.isSafeInteger(initialPoints) && initialPoints > 0 ? initialPoints : 0)
  const storage = await IndexedDbPetStorage.create()
  const requestedPack = params.get('pack')
  // Any bundled packId may be deep-linked (creator packs included); unknown
  // ids are ignored rather than persisted. Mirrors the directory-scan
  // registry — adding a pack never edits this file.
  if (requestedPack !== null && bundledPackBundles.some((bundle) => (bundle.manifestCandidate as { packId?: string }).packId === requestedPack)) {
    await storage.setActivePackId(requestedPack)
  }

  const container = document.getElementById('root')
  if (container === null) throw new Error('#root not found')

  createRoot(container).render(
    <App
      source={source}
      storage={storage}
      initialReducedMotion={params.get('reducedMotion') === '1'}
      dev={params.get('dev') === '1'}
      showcase={params.get('showcase') === '1'}
      petPreview={params.get('petPreview') === '1'}
    />,
  )
}

void bootstrap()
