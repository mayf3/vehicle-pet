import { describe, expect, it } from 'vitest'
import { CHARACTER_DEFINITIONS, COMPANION_POSES, characterLevel } from '../../../src/dsh/client/characters'
import { characterSpeechCatalog } from '../../../src/dsh/client/speech-catalog'
import { normalizeOverlayPreferences, adoptStorageEvent, OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'

describe('V4 shared character presentation data', () => {
  it('offers exactly two characters and ten distinct pose carriers', () => {
    expect(Object.keys(CHARACTER_DEFINITIONS)).toEqual(['vehicle','companion'])
    expect(new Set(Object.values(COMPANION_POSES)).size).toBe(10)
  })
  it('maps operational meanings and preserves exact grades without inventing unknown levels', () => {
    expect(characterLevel('l2','zh-CN')).toMatchObject({grade:'L2',description:'有人驾驶，无保护车'})
    expect(characterLevel('l1','en')?.description).toContain('escort')
    expect(characterLevel('l3','en')?.description).toContain('Safety copilot')
    expect(characterLevel('l4','en')?.description).toContain('no escort')
    expect(characterLevel('l5','en')?.description).toContain('Remote 1:1')
    expect(characterLevel('l12','en')?.description).toContain('1M cars')
    expect(characterLevel('unknown','en')).toBeNull()
  })
  it('keeps valid preference fields when character is absent/invalid and syncs only character changes', () => {
    const old={schemaVersion:1,size:'small',collapsed:true,characterId:'removed',position:{xRatio:.3,yRatio:.4}}
    const normalized=normalizeOverlayPreferences(old)
    expect(normalized).toMatchObject({characterId:'vehicle',size:'small',collapsed:true,position:old.position})
    const next=adoptStorageEvent({key:OVERLAY_PREFERENCES_KEY,newValue:JSON.stringify({...normalized,characterId:'companion'})},normalized)
    expect(next).toEqual({...normalized,characterId:'companion'})
    expect(adoptStorageEvent({key:OVERLAY_PREFERENCES_KEY,newValue:JSON.stringify(next)},next!)).toBeNull()
  })
  it('has original catalogs for each character and locale with all six categories', () => {
    for(const id of ['vehicle','companion'] as const) for(const locale of ['zh-CN','en']) {
      const catalog=characterSpeechCatalog(id,locale)
      expect(catalog.length).toBeGreaterThanOrEqual(30)
      for(const category of ['idle','working','needs-input','completed','failed','milestone']) {
        expect(catalog.filter(l=>l.category===category).length).toBeGreaterThanOrEqual(5)
      }
      expect(catalog.filter(l=>l.category==='failed').every(l=>!/失败|没跑通|failed|error/i.test(l.text))).toBe(true)
    }
  })
})
