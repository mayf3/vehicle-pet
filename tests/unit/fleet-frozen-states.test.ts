import { describe, expect, it } from 'vitest'
import { buildSceneRenderPlan } from '../../src/engine/rendering/render-plan'
import { fleetManifest } from '../helpers/fixtures'

const pack = fleetManifest()

describe('X02 Fleet L1-L4 frozen visual states', () => {
  it('retains road-test while subject-swap selects each level keepsake asset', () => {
    const firstFour = pack.levels.slice(0, 4)
    expect(firstFour.map((level) => level.sceneId)).toEqual([
      'road-test',
      'road-test',
      'road-test',
      'road-test',
    ])

    const subjects = firstFour.map((level) => {
      const plan = buildSceneRenderPlan({ manifest: pack, level, locale: 'en' })
      expect(plan.sceneId).toBe('road-test')
      return plan.nodes.find((node) => node.kind === 'subject')!
    })

    expect(subjects.map((subject) => subject.assetId)).toEqual([
      'sprite-subject-pod--l1',
      'sprite-subject-pod--l2',
      'sprite-subject-pod--l3',
      'sprite-subject-pod--l4',
    ])
    expect(new Set(subjects.map((subject) => subject.assetId)).size).toBe(4)
    expect(subjects[0]!.altText).toMatch(/driver aboard.*protection vehicle behind/)
    expect(subjects[1]!.altText).toMatch(/driver aboard.*no protection vehicle/)
    expect(subjects[2]!.altText).toMatch(/safety officer aboard.*protection vehicle behind/)
    expect(subjects[3]!.altText).toMatch(/safety officer aboard.*no protection vehicle/)
  })

  it('uses the scene asset unless subject-swap resolves a keepsake asset', () => {
    const l5 = pack.levels[4]!
    const l5Plan = buildSceneRenderPlan({ manifest: pack, level: l5, locale: 'zh-CN' })
    expect(l5Plan.nodes.find((node) => node.kind === 'subject')?.assetId).toBe('sprite-subject-pod')

    const l2WithoutSubjectSwap = {
      ...pack.levels[1]!,
      upgrade: { ...pack.levels[1]!.upgrade!, reveal: 'scene-expand' as const },
    }
    const unchanged = buildSceneRenderPlan({ manifest: pack, level: l2WithoutSubjectSwap, locale: 'zh-CN' })
    expect(unchanged.nodes.find((node) => node.kind === 'subject')?.assetId).toBe('sprite-subject-pod--l1')
  })
})
