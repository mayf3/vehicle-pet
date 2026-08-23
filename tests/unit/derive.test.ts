import { describe, expect, it } from 'vitest'
import { deriveLevel, deriveProgress, derivePetViewModel } from '../../src/engine/progress/derive'
import { fleetManifest, FLEET_THRESHOLDS } from '../helpers/fixtures'

const pack = fleetManifest()

describe('pure level derivation (CTR-PET-002, ACC-PET-002)', () => {
  it('derives at threshold boundaries: before, exact, one past', () => {
    for (let i = 0; i < FLEET_THRESHOLDS.length; i++) {
      const threshold = FLEET_THRESHOLDS[i]!
      if (threshold > 0) {
        const before = deriveLevel(threshold - 1, pack)
        expect(before.levelIndex, `before ${threshold}`).toBe(i)
      }
      const exact = deriveLevel(threshold, pack)
      expect(exact.levelIndex, `at ${threshold}`).toBe(i + 1)
      expect(exact.level.levelId, `at ${threshold}`).toBe(pack.levels[i]!.levelId)
      const after = deriveLevel(threshold + 1, pack)
      expect(after.levelIndex, `after ${threshold}`).toBe(i + 1)
    }
  })

  it('caps at the final level for huge values including MAX_SAFE_INTEGER', () => {
    for (const points of [2_500_000, 2_500_001, 10 ** 12, Number.MAX_SAFE_INTEGER]) {
      const derived = deriveProgress(points, pack)
      expect(derived.capped, `points ${points}`).toBe(true)
      expect(derived.level.levelId).toBe('l12')
      expect(derived.nextLevelId).toBeNull()
      expect(derived.remainingPoints).toBe(0)
      expect(derived.withinLevelEarned).toBe(0)
      expect(derived.withinLevelSpan).toBe(1)
    }
  })

  it('computes within-level progress, remaining points, and next level', () => {
    const derived = deriveProgress(15_000, pack)
    expect(derived.level.levelId).toBe('l2')
    expect(derived.withinLevelEarned).toBe(5_000)
    expect(derived.withinLevelSpan).toBe(20_000)
    expect(derived.nextLevelId).toBe('l3')
    expect(derived.remainingPoints).toBe(15_000)
  })

  it('derives the frozen PetViewModel fields', () => {
    const viewModel = derivePetViewModel({
      sourceId: 'mock-progress',
      subjectId: 'subject-1',
      progressPoints: 1_800_000,
      revision: 7,
      pack,
      locale: 'zh-CN',
      reducedMotion: true,
    })
    expect(viewModel).toMatchObject({
      schemaVersion: 1,
      activePackId: 'autonomous-fleet',
      packVersion: '1.0.0',
      derivedLevelId: 'l11',
      derivedLevelIndex: 11,
      capped: false,
      locale: 'zh-CN',
      reducedMotion: true,
      state: 'ready',
      revision: 7,
    })
  })
})
