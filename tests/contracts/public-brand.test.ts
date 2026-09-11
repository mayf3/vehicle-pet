/**
 * Public-preview brand + presentation contracts (DSH_PET_OVERLAY_ADAPTER_V8
 * §17): PUBLIC_BRAND_RUNTIME_CHECK, PUBLIC_BRAND_FALLBACK_CHECK,
 * LEVEL_PRESENTATION_POLICY_CHECK, DYNAMIC_CHARACTER_REGISTRY_CHECK,
 * PREFERENCE_MIGRATION_CHECK, CURRENT_SHIPPING_ASSET_INVENTORY_CHECK
 * (source-level half; the built-bundle half lives in check-dsh-bundle.mjs).
 *
 * Brand rule: current runtime source must not bind a third-party company
 * brand as product identity. Historical truth is preserved: provenance
 * records and masters keep their factual content and are explicitly
 * allowlisted here (HISTORICAL_REFERENCE != CURRENT_PRODUCT_IDENTITY).
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PET_ID, petDefinition, petPresentations, resolvePetId, userSelectablePets } from '../../src/dsh/client/pets/bundled'

const REPO_ROOT = join(import.meta.dirname, '../..')
const RUNTIME_SCAN_ROOTS = ['src/dsh/client', 'src/react', 'src/engine', 'src/prototype']
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.json', '.css']
/** Factual provenance / historical records keep their real content. */
const BRAND_ALLOWLIST = [
  'src/packs/autonomous-fleet/assets/masters/PROVENANCE.json',
  'src/packs/autonomous-fleet/assets/masters/PROVENANCE-v2-identity.json',
  'src/packs/autonomous-fleet/assets/masters/PROVENANCE-l6-l12-evolution.json',
]
const THIRD_PARTY_BRANDS = ['Pony.ai', 'pony.ai']

function listFiles(root: string, base: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return listFiles(path, base)
    if (!SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) return []
    return [path]
  })
}

describe('PUBLIC_BRAND_RUNTIME_CHECK (V8 CTR-039)', () => {
  it('binds no third-party company brand in current runtime source', () => {
    const offenders: string[] = []
    for (const scanRoot of RUNTIME_SCAN_ROOTS) {
      const root = join(REPO_ROOT, scanRoot)
      if (!existsSync(root)) continue
      for (const file of listFiles(root, REPO_ROOT)) {
        const relative = file.slice(REPO_ROOT.length + 1)
        if (BRAND_ALLOWLIST.includes(relative)) continue
        const content = readFileSync(file, 'utf8')
        for (const brand of THIRD_PARTY_BRANDS) {
          if (content.includes(brand)) offenders.push(`${relative}: contains ${brand}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps historical provenance records factually intact (no erasure)', () => {
    for (const relative of BRAND_ALLOWLIST) {
      const file = join(REPO_ROOT, relative)
      expect(existsSync(file), `${relative} must not be deleted`).toBe(true)
      expect(readFileSync(file, 'utf8').length).toBeGreaterThan(0)
    }
  })
})

describe('PUBLIC_BRAND_FALLBACK_CHECK (V8 CTR-039)', () => {
  it('resolves every pet display name from pet data, never a brand constant', () => {
    for (const pet of petPresentations) {
      expect(typeof pet.displayName['zh-CN']).toBe('string')
      expect(typeof pet.displayName.en).toBe('string')
      expect(pet.displayName.en).not.toMatch(/pony/i)
      expect(pet.license.provenance).toMatch(/PROVENANCE|provenance|LICENSE|license/)
    }
  })
})

describe('LEVEL_PRESENTATION_POLICY_CHECK (V8 CTR-040)', () => {
  it('declares a complete, decoupled grade policy per pet', () => {
    for (const pet of petPresentations) {
      expect(['none', 'overlay', 'wearable']).toContain(pet.gradePolicy.insigniaMode)
      expect(typeof pet.gradePolicy.showExactLevelNumber).toBe('boolean')
      expect(typeof pet.gradePolicy.showDescription).toBe('boolean')
      // Reference pets on the shared fleet journey keep the full 12-level
      // ladder; pets on their own journeys size their ladder to their pack.
      const referenceOnFleet = pet.packId === 'autonomous-fleet'
      expect(pet.gradeLevels.length).toBeGreaterThanOrEqual(referenceOnFleet ? 12 : 1)
      for (const level of pet.gradeLevels) {
        expect(level.id).toMatch(/^l\d+$/)
        expect(level['zh-CN'].length).toBeGreaterThan(0)
        expect(level.en.length).toBeGreaterThan(0)
      }
      const insigniaWearable = pet.gradePolicy.insigniaMode === 'wearable'
      expect(pet.poseSprite?.insignia !== undefined).toBe(insigniaWearable ? pet.recipe === 'pose-sprite' : false)
    }
  })

  it('keeps exact grade identity in DOM data and policies independent', () => {
    const vehicle = petDefinition('vehicle')
    expect(vehicle.gradePolicy.insigniaMode).toBe('none')
    expect(vehicle.gradePolicy.showExactLevelNumber).toBe(false)
  })
})

describe('DYNAMIC_CHARACTER_REGISTRY_CHECK (V8 CTR-038/041)', () => {
  it('derives the selectable list from registered data, not a fixed union', () => {
    const ids = userSelectablePets().map(pet => pet.id)
    expect(ids).toContain('vehicle')
    expect(ids).toContain('companion')
    expect(resolvePetId('not-bundled')).toBe(DEFAULT_PET_ID)
    expect(resolvePetId(ids[0])).toBe(ids[0])
  })

  it('binds every user-selectable pet to a declared journey pack', () => {
    for (const pet of userSelectablePets()) {
      expect(typeof pet.packId).toBe('string')
      expect(pet.packId.length).toBeGreaterThan(0)
      expect(['engine-scene', 'pose-sprite']).toContain(pet.recipe)
    }
  })
})

describe('PREFERENCE_MIGRATION_CHECK (V8 CTR-041)', () => {
  it('resolves legacy vehicle/companion preferences unchanged and unknown ids to the default', () => {
    expect(resolvePetId('vehicle')).toBe('vehicle')
    expect(resolvePetId('companion')).toBe('companion')
    expect(resolvePetId(undefined)).toBe(DEFAULT_PET_ID)
    expect(resolvePetId(42)).toBe(DEFAULT_PET_ID)
  })
})

describe('CURRENT_SHIPPING_ASSET_INVENTORY_CHECK (V8 CTR-042, source half)', () => {
  it('documents provenance for every bundled pet presentation', () => {
    for (const pet of petPresentations) {
      const provenancePath = join(REPO_ROOT, pet.license.provenance)
      expect(existsSync(provenancePath), pet.license.provenance).toBe(true)
    }
  })
})
