import { describe, expect, it } from 'vitest'
import { DEFAULT_PET_ID, petDefinition, petGrade, resolvePetId, userSelectablePets } from '../../../src/dsh/client/pets/bundled'
import { characterSpeechCatalog } from '../../../src/dsh/client/speech-catalog'
import { normalizeOverlayPreferences, adoptStorageEvent, OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'

describe('V8 declarative pet presentation registry', () => {
  it('offers the bundled pets with both references first; pose mappings stay injective (CTR-041)', () => {
    const ids = userSelectablePets().map(pet => pet.id)
    expect(ids.slice(0, 2)).toEqual(['vehicle', 'companion'])
    expect(ids).toContain('orb')
    const companionPoses = petDefinition('companion').poseSprite?.variantPose ?? {}
    expect(new Set(Object.values(companionPoses)).size).toBe(10)
    const orbPoses = petDefinition('orb').poseSprite?.variantPose ?? {}
    expect(new Set(Object.values(orbPoses)).size).toBe(10)
  })
  it('maps operational meanings and preserves exact grades without inventing unknown levels', () => {
    expect(petGrade('vehicle', 'l2', 'zh-CN')).toMatchObject({grade:'L2',description:'有人驾驶，无保护车'})
    expect(petGrade('vehicle', 'l1', 'en')?.description).toContain('escort')
    expect(petGrade('vehicle', 'l3', 'en')?.description).toContain('Safety copilot')
    expect(petGrade('vehicle', 'l4', 'en')?.description).toContain('no escort')
    expect(petGrade('vehicle', 'l5', 'en')?.description).toContain('Remote 1:1')
    expect(petGrade('vehicle', 'l12', 'en')?.description).toContain('1M cars')
    expect(petGrade('vehicle', 'unknown', 'en')).toBeNull()
    expect(petGrade('removed-pet', 'l1', 'en')).toBeNull()
  })
  it('fails soft unknown pet ids to the documented default and keeps valid preference fields (CTR-041)', () => {
    expect(resolvePetId(undefined)).toBe(DEFAULT_PET_ID)
    expect(resolvePetId('removed')).toBe(DEFAULT_PET_ID)
    expect(resolvePetId('companion')).toBe('companion')
    const old={schemaVersion:1,size:'small',collapsed:true,characterId:'removed',position:{xRatio:.3,yRatio:.4}}
    const normalized=normalizeOverlayPreferences(old)
    expect(normalized).toMatchObject({characterId:'vehicle',size:'small',collapsed:true,position:old.position})
    const next=adoptStorageEvent({key:OVERLAY_PREFERENCES_KEY,newValue:JSON.stringify({...normalized,characterId:'companion'})},normalized)
    expect(next).toEqual({...normalized,characterId:'companion'})
    expect(adoptStorageEvent({key:OVERLAY_PREFERENCES_KEY,newValue:JSON.stringify(next)},next!)).toBeNull()
  })
  it('has original catalogs for each reference pet and locale with all six categories', () => {
    for(const id of ['vehicle','companion'] as const) for(const locale of ['zh-CN','en']) {
      const catalog=characterSpeechCatalog(id,locale)
      expect(catalog.length).toBeGreaterThanOrEqual(30)
      for(const category of ['idle','working','needs-input','completed','failed','milestone']) {
        expect(catalog.filter(l=>l.category===category).length).toBeGreaterThanOrEqual(5)
      }
      expect(catalog.filter(l=>l.category==='failed').every(l=>!/失败|没跑通|failed|error/i.test(l.text))).toBe(true)
    }
  })
  it('declares grade presentation policies per pet (V8 DEC-029)', () => {
    expect(petDefinition('vehicle').gradePolicy).toMatchObject({ showExactLevelNumber: false, showDescription: true, insigniaMode: 'none' })
    expect(petDefinition('companion').gradePolicy).toMatchObject({ showExactLevelNumber: false, showDescription: true, insigniaMode: 'wearable' })
    expect(petDefinition('vehicle').packId).toBe('autonomous-fleet')
    expect(petDefinition('companion').packId).toBe('autonomous-fleet')
  })
})
