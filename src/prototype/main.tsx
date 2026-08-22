/**
 * Prototype shell entrypoint. URL parameters:
 *   ?showcase=1                       static multi-state showcase
 *   ?pack=<bundled packId>            ignored by the engine (activePackId is a
 *                                     persisted device preference) but selects
 *                                     the initial mock progress scale
 *   ?points=<safe integer>            initial MockProgressSource points
 *   ?reducedMotion=1                  start with reduced motion on
 */

import { createRoot } from 'react-dom/client'
import { IndexedDbPetStorage } from '../engine'
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

  const container = document.getElementById('root')
  if (container === null) throw new Error('#root not found')

  createRoot(container).render(
    <App
      source={source}
      storage={storage}
      initialReducedMotion={params.get('reducedMotion') === '1'}
      showcase={params.get('showcase') === '1'}
    />,
  )
}

void bootstrap()
