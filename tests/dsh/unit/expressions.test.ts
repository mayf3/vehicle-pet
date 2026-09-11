/**
 * Expression system unit evidence (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-006/
 * 014; ACC-OVERLAY-107/117): per-level anchor coverage over the bundled
 * manifest, five-state mapping core, >=8 statically bundled variants, the
 * pure selection rules (no immediate repeats, milestone → proud, cancelled →
 * relaxed), bundled asset presence with byte-exact provenance hashes, and the
 * preserved two-Pack Engine conformance bundle.
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import autonomousFleetManifest from '../../../src/packs/autonomous-fleet/manifest.json'
import seedlingFixtureManifest from '../../../src/packs/seedling-fixture/manifest.json'
import { dshPackBundles, dshDefaultPackId, resolvePetPackId } from '../../../src/dsh/client/engine-bundles'
import {
  expressionAnchor,
  expressionAsset,
  expressionStateFromSession,
  selectExpressionVariant,
  type VehiclePetExpressionState,
  type VehiclePetExpressionVariant,
} from '../../../src/dsh/client/expressions'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'
import { petDefinition } from '../../../src/dsh/client/pets/bundled'

const EXPRESSION_LEVEL_ANCHORS = petDefinition('vehicle').engineScene!.expressionAnchors

const PROVENANCE = JSON.parse(readFileSync(
  new URL('../../../src/dsh/client/assets/expressions/PROVENANCE.json', import.meta.url),
  'utf8',
)) as { sha256: Record<string, string> }

const STATES: readonly VehiclePetExpressionState[] = ['idle', 'working', 'needs-input', 'completed', 'failed']

const VARIANTS: readonly VehiclePetExpressionVariant[] = [
  'idle', 'idle-happy', 'idle-curious', 'idle-sleepy',
  'working', 'needs-input', 'completed', 'completed-proud',
  'failed', 'cancelled',
]

describe('expression anchors (CTR-OVERLAY-014)', () => {
  it('covers every level of the bundled product manifest within canvas bounds', () => {
    const levelIds = autonomousFleetManifest.levels.map(level => level.levelId)
    expect(levelIds.length).toBeGreaterThanOrEqual(12)
    for (const levelId of levelIds) {
      const anchor = expressionAnchor(EXPRESSION_LEVEL_ANCHORS, levelId)
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

describe('bundled expression variants (V3 CTR-OVERLAY-014: >=8 statically distinct)', () => {
  it('provides webp and png for at least 8 variants covering the required semantics', () => {
    expect(VARIANTS.length).toBeGreaterThanOrEqual(8)
    for (const variant of VARIANTS) {
      const asset = expressionAsset(variant)
      expect(asset, `missing asset for ${variant}`).not.toBeNull()
      expect(asset?.webp).not.toBe('')
      expect(asset?.png).not.toBe('')
    }
  })

  it('keeps the five-state mapping duty inside the variant set', () => {
    for (const state of STATES) {
      expect(VARIANTS, `state ${state} lost from the variant set`).toContain(state)
    }
  })

  it('selects deterministically: working/needs-input fixed, milestone proud, cancelled relaxed', () => {
    const base = {
      state: 'idle' as VehiclePetExpressionState,
      terminalStatus: null,
      milestoneActive: false,
      clickCount: 0,
      idleBucket: 0 as 0 | 1 | 2,
      lastVariantForState: undefined,
    }
    expect(selectExpressionVariant({ ...base, state: 'working' })).toBe('working')
    expect(selectExpressionVariant({ ...base, state: 'needs-input' })).toBe('needs-input')
    expect(selectExpressionVariant({ ...base, state: 'completed' })).toBe('completed')
    expect(selectExpressionVariant({ ...base, state: 'completed', milestoneActive: true })).toBe('completed-proud')
    expect(selectExpressionVariant({ ...base, state: 'failed', terminalStatus: 'failed' })).toBe('failed')
    expect(selectExpressionVariant({ ...base, state: 'failed', terminalStatus: 'cancelled' })).toBe('cancelled')
  })

  it('cycles the idle pool on clicks without repeating back-to-back', () => {
    const seen: VehiclePetExpressionVariant[] = []
    let last: VehiclePetExpressionVariant | undefined
    for (let click = 1; click <= 6; click += 1) {
      const variant = selectExpressionVariant({
        state: 'idle',
        terminalStatus: null,
        milestoneActive: false,
        clickCount: click,
        idleBucket: 0,
        lastVariantForState: last,
      })
      expect(variant, `click ${click} repeated ${last}`).not.toBe(last)
      seen.push(variant)
      last = variant
    }
    expect(new Set(seen).size).toBeGreaterThan(1)
  })

  it('long idle quiet presents the resting variant regardless of clicks', () => {
    expect(selectExpressionVariant({
      state: 'idle', terminalStatus: null, milestoneActive: false,
      clickCount: 0, idleBucket: 2, lastVariantForState: undefined,
    })).toBe('idle-sleepy')
  })
})

describe('bundled expression assets (CTR-OVERLAY-014, CTR-OVERLAY-008)', () => {
  it('matches the recorded PROVENANCE sha256 for every exported artifact', () => {
    expect(Object.keys(PROVENANCE.sha256).sort()).toEqual(
      VARIANTS.flatMap(variant => [`expr-${variant}.png`, `expr-${variant}.webp`]).sort(),
    )
    for (const [name, hash] of Object.entries(PROVENANCE.sha256)) {
      const bytes = readFileSync(new URL(`../../../src/dsh/client/assets/expressions/${name}`, import.meta.url))
      expect(createHash('sha256').update(bytes).digest('hex'), `${name} drifted`).toBe(hash)
    }
  })
})

describe('bundled multi-Pack surface (V8 DEC-OVERLAY-028)', () => {
  it('discovers every bundled Pack manifest with the default journey present', () => {
    const packIds = dshPackBundles.map(bundle => (bundle.manifestCandidate as { packId: string }).packId).sort()
    expect(packIds).toContain('autonomous-fleet')
    expect(packIds).toContain('seedling-fixture')
    expect(packIds).toContain('orb-fixture')
    expect(dshDefaultPackId).toBe('autonomous-fleet')
    expect(seedlingFixtureManifest.packId).toBe('seedling-fixture')
  })

  it('resolves a pet journey by its declarative binding and falls soft to the default (CTR-041)', () => {
    expect(resolvePetPackId('vehicle')).toBe('autonomous-fleet')
    expect(resolvePetPackId('companion')).toBe('autonomous-fleet')
    expect(resolvePetPackId('orb')).toBe('orb-fixture')
    expect(resolvePetPackId('removed-pet')).toBe('autonomous-fleet')
    expect(resolvePetPackId(undefined)).toBe('autonomous-fleet')
  })
})
