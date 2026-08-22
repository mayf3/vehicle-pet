import { describe, expect, it } from 'vitest'
import { fleetManifest, FLEET_THRESHOLDS } from '../helpers/fixtures'

const manifest = fleetManifest()

describe('autonomous-fleet content freeze (CTR-PET-010, ACC-PET-010)', () => {
  it('implements exactly the 12 frozen MOCK_PROGRESS_POINTS thresholds', () => {
    expect(manifest.levels.map((l) => l.threshold)).toEqual(FLEET_THRESHOLDS)
  })

  it('keeps the frozen zh-CN narrative for every level', () => {
    const summaries = [
      '主驾有人，副驾无人，有后方保护车，1 辆车。',
      '主驾有人，副驾无人，无后方保护车，1 辆车。',
      '主驾无人，副驾有安全员，有后方保护车，1 辆车。',
      '主驾无人，副驾有安全员，无后方保护车，1 辆车。',
      '主驾、副驾均无人，无保护车，1 名远程人员监管 1 辆车。',
      '1 名远程人员监管 3 辆无人车。',
      '1 名远程人员监管 10 辆无人车。',
      '1 名远程人员监管 100 辆无人车。',
      '1 名远程人员监管 1,000 辆无人车。',
      '1 名远程人员监管 10,000 辆无人车。',
      '1 名远程人员监管 100,000 辆无人车。',
      '1 名远程人员监管 1,000,000 辆无人车；V1 当前封顶。',
    ]
    expect(manifest.levels.map((l) => l.summary['zh-CN'])).toEqual(summaries)
  })

  it('assigns the frozen per-level scene/scale/camera/milestone presets', () => {
    const expected = [
      ['road-test', 'individual', 'close', 'inline'],
      ['road-test', 'individual', 'close', 'inline'],
      ['road-test', 'individual', 'close', 'inline'],
      ['road-test', 'individual', 'close', 'inline'],
      ['road-test', 'individual', 'close', 'inline'],
      ['convoy', 'individual', 'close', 'inline'],
      ['district-fleet', 'individual', 'district', 'inline'],
      ['city-fleet', 'group', 'city', 'inline'],
      ['metro-network', 'cluster', 'metro', 'inline'],
      ['regional-field', 'field', 'regional', 'inline'],
      ['continental-web', 'region', 'continental', 'inline'],
      ['terminal-horizon', 'horizon', 'terminal', 'terminal'],
    ] as const
    expect(
      manifest.levels.map((l) => [l.sceneId, l.presentation.scale, l.presentation.camera, l.presentation.milestone]),
    ).toEqual(expected as unknown)
  })

  it('assigns the frozen population table: vehicles ×3/×10/×100/×1000/×10000/×100000/×1000000', () => {
    const counts: Array<[string, number | null]> = [
      ['l1', null], ['l2', null], ['l3', null], ['l4', null], ['l5', null],
      ['l6', 3], ['l7', 10], ['l8', 100], ['l9', 1000], ['l10', 10000], ['l11', 100000], ['l12', 1000000],
    ]
    for (const [levelId, expectedCount] of counts) {
      const level = manifest.levels.find((l) => l.levelId === levelId)!
      const scene = manifest.scenes.find((s) => s.sceneId === level.sceneId)!
      const population = scene.layers.flatMap((l) => (l.population !== undefined ? [l.population] : []))[0]
      if (expectedCount === null) {
        expect(population, `${levelId} should have no population`).toBeUndefined()
      } else {
        expect(population?.logicalCount, `${levelId}`).toBe(expectedCount)
        expect(population?.populationId).toBe('vehicles')
      }
    }
  })

  it('declares exactly 11 keepsakes bound one-to-one to L2–L12', () => {
    expect(manifest.keepsakes).toHaveLength(11)
    const nonInitial = manifest.levels.slice(1)
    expect(nonInitial.every((l) => l.keepsakeId !== undefined)).toBe(true)
    const levelIds = manifest.keepsakes!.map((k) => k.levelId).sort()
    expect(levelIds).toEqual(nonInitial.map((l) => l.levelId).sort())
  })

  it('owns the 100-points-per-km display conversion and never mentions Token billing', () => {
    expect(manifest.displayConversion?.pointsPerUnit).toBe(100)
    expect(manifest.displayConversion?.unitLabel['zh-CN']).toBe('公里')
    const allText = JSON.stringify(manifest)
    for (const banned of ['Token 计费', 'token billing', '账单', 'billing']) {
      expect(allText.includes(banned), `copy must not claim ${banned}`).toBe(false)
    }
  })

  it('uses exactly the frozen eight-scene set', () => {
    expect(manifest.scenes.map((s) => s.sceneId).sort()).toEqual(
      [
        'city-fleet',
        'continental-web',
        'convoy',
        'district-fleet',
        'metro-network',
        'regional-field',
        'road-test',
        'terminal-horizon',
      ].sort(),
    )
  })

  it('marks thresholds as mock progression points, not billing rules', () => {
    // The narrative summary table is the freeze; thresholds appear only as data.
    expect(manifest.levels.every((l) => Number.isSafeInteger(l.threshold) && l.threshold >= 0)).toBe(true)
  })
})
