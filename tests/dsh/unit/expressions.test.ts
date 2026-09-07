/**
 * Expression system unit evidence (DSH_PET_OVERLAY_ADAPTER_V2 CTR-OVERLAY-006/
 * 014; ACC-OVERLAY-019/020): per-level anchor coverage over the bundled
 * manifest, five-state mapping including cancelled → failed, bundled asset
 * presence with byte-exact provenance hashes, and the preserved two-Pack
 * Engine conformance bundle.
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import autonomousFleetManifest from '../../../src/packs/autonomous-fleet/manifest.json'
import seedlingFixtureManifest from '../../../src/packs/seedling-fixture/manifest.json'
import { dshPackBundles, dshDefaultPackId, resolveDshProductPackId } from '../../../src/dsh/client/engine-bundles'
import {
  EXPRESSION_LEVEL_ANCHORS,
  expressionAnchor,
  expressionAsset,
  expressionStateFromSession,
  type VehiclePetExpressionState,
} from '../../../src/dsh/client/expressions'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'

const PROVENANCE = JSON.parse(readFileSync(
  new URL('../../../src/dsh/client/assets/expressions/PROVENANCE.json', import.meta.url),
  'utf8',
)) as { sha256: Record<string, string> }

const STATES: readonly VehiclePetExpressionState[] = ['idle', 'working', 'needs-input', 'completed', 'failed']

describe('expression anchors (CTR-OVERLAY-014)', () => {
  it('covers every level of the bundled product manifest within canvas bounds', () => {
    const levelIds = autonomousFleetManifest.levels.map(level => level.levelId)
    expect(levelIds.length).toBeGreaterThanOrEqual(12)
    for (const levelId of levelIds) {
      const anchor = expressionAnchor(levelId)
      expect(anchor, `missing anchor for ${levelId}`).not.toBeNull()
      const [left, top, size] = anchor as readonly [number, number, number]
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(left + size).toBeLessThanOrEqual(100)
      expect(top + size).toBeLessThanOrEqual(100)
    }
    expect(EXPRESSION_LEVEL_ANCHORS.l1).toBeDefined()
    expect(EXPRESSION_LEVEL_ANCHORS.l12).toBeDefined()
  })
})

describe('session → expression mapping (CTR-OVERLAY-007, V2 §8.3)', () => {
  const view = (live: VehiclePetSessionView['live'], terminal: VehiclePetSessionView['terminal']): VehiclePetSessionView =>
    ({ live, terminal })

  it('maps the five user-perceivable states with cancelled sharing the failed presentation', () => {
    expect(expressionStateFromSession(view('idle', null))).toBe('idle')
    expect(expressionStateFromSession(view('running', null))).toBe('working')
    expect(expressionStateFromSession(view('needs-input', null))).toBe('needs-input')
    expect(expressionStateFromSession(view('idle', { identity: 's#1#1', status: 'completed' }))).toBe('completed')
    expect(expressionStateFromSession(view('idle', { identity: 's#1#2', status: 'failed' }))).toBe('failed')
    expect(expressionStateFromSession(view('idle', { identity: 's#1#3', status: 'cancelled' }))).toBe('failed')
  })

  it('needs-input outranks a live running state only through the adapter precedence', () => {
    // The adapter owns precedence; the mapping itself is total and pure.
    for (const live of ['idle', 'running', 'needs-input'] as const) {
      const state = expressionStateFromSession(view(live, { identity: 's#2#1', status: 'failed' }))
      expect(['completed', 'failed']).toContain(state)
    }
  })
})

describe('bundled expression assets (CTR-OVERLAY-014, CTR-OVERLAY-008)', () => {
  it('provides webp and png for all five states with non-empty data URLs', () => {
    for (const state of STATES) {
      const asset = expressionAsset(state)
      expect(asset, `missing asset for ${state}`).not.toBeNull()
      expect(asset?.webp).not.toBe('')
      expect(asset?.png).not.toBe('')
    }
  })

  it('matches the recorded PROVENANCE sha256 for every exported artifact', () => {
    expect(Object.keys(PROVENANCE.sha256).sort()).toEqual(
      STATES.flatMap(state => [`expr-${state}.png`, `expr-${state}.webp`]).sort(),
    )
    for (const [name, hash] of Object.entries(PROVENANCE.sha256)) {
      const bytes = readFileSync(new URL(`../../../src/dsh/client/assets/expressions/${name}`, import.meta.url))
      expect(createHash('sha256').update(bytes).digest('hex'), `${name} drifted`).toBe(hash)
    }
  })
})

describe('second-Pack conformance preserved with a product-only DSH surface (CTR-OVERLAY-006)', () => {
  it('still bundles exactly the two Pack manifests with the product Pack as default', () => {
    expect(dshPackBundles).toHaveLength(2)
    const packIds = dshPackBundles.map(bundle => (bundle.manifestCandidate as { packId: string }).packId).sort()
    expect(packIds).toEqual(['autonomous-fleet', 'seedling-fixture'])
    expect(dshDefaultPackId).toBe('autonomous-fleet')
    expect(seedlingFixtureManifest.packId).toBe('seedling-fixture')
  })

  it('resolves a legacy non-product activePackId to the product Pack without touching stored records', () => {
    expect(resolveDshProductPackId('autonomous-fleet')).toBe('autonomous-fleet')
    expect(resolveDshProductPackId('seedling-fixture')).toBe('autonomous-fleet')
    expect(resolveDshProductPackId(undefined)).toBe('autonomous-fleet')
  })
})
