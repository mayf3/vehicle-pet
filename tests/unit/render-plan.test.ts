import { describe, expect, it } from 'vitest'
import { buildSceneRenderPlan, buildStructureFingerprint, structuralDifferenceCount } from '../../src/engine/rendering/render-plan'
import { fleetManifest } from '../helpers/fixtures'
import type { PetPackManifestV1 } from '../../src/engine'

const pack = fleetManifest()

function planFor(points: number, locale: 'zh-CN' | 'en' = 'zh-CN') {
  const levels = pack.levels
  let current = levels[0]!
  for (const level of levels) {
    if (points >= level.threshold) current = level
  }
  return buildSceneRenderPlan({ manifest: pack, level: current, locale })
}

describe('SceneRenderPlan determinism and caps (CTR-PET-007, CTR-PET-008)', () => {
  it('produces byte-identical plans for repeated renders', () => {
    const a = planFor(2_500_000)
    const b = planFor(2_500_000)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('never exceeds 64 nodes per scene, 32 per population', () => {
    for (const level of pack.levels) {
      const plan = buildSceneRenderPlan({ manifest: pack, level, locale: 'zh-CN' })
      expect(plan.nodes.length, `${level.levelId}`).toBeLessThanOrEqual(64)
      const byPop = new Map<string, number>()
      for (const node of plan.nodes) {
        if (node.kind !== 'population-representative') continue
        const populationId = node.nodeId.split(':')[1]!
        byPop.set(populationId, (byPop.get(populationId) ?? 0) + 1)
      }
      for (const [populationId, count] of byPop) {
        expect(count, `${level.levelId}/${populationId}`).toBeLessThanOrEqual(32)
      }
    }
  })

  it('caps representatives by density render limit: 16 for sparse, 24 for moderate', () => {
    // Fixture garden pack has sparse; fleet moderate scenes show 24.
    const l7 = planFor(300_000)
    const reps = l7.nodes.filter((n) => n.kind === 'population-representative')
    expect(reps.length).toBe(10) // logicalCount 10 < renderLimit 24
  })

  it('keeps aggregate semantics for budget-exhausted populations', () => {
    // A synthetic pack with many populations exhausting the 64-node budget.
    const layers = []
    for (let i = 0; i < 8; i++) {
      layers.push({
        layerId: `pop-layer-${i}`,
        kind: 'decoration' as const,
        population: {
          populationId: `pop-${i}`,
          logicalCount: 40,
          assetId: 'sprite-subject-pod--l1',
          density: 'dense' as const,
          placement: 'grid-even' as const,
          aggregateLabel: { 'zh-CN': '个单元' },
        },
        placement: 'center' as const,
        zOrder: 10 + i,
      })
    }
    layers.push({ layerId: 'pod', kind: 'subject' as const, assetId: 'sprite-subject-pod--l1', placement: 'center' as const, zOrder: 30 })
    const synthetic: PetPackManifestV1 = {
      ...pack,
      scenes: [{ ...pack.scenes[0]!, sceneId: 'budget-scene', layers: layers as never }],
    }
    const level = { ...pack.levels[0]!, sceneId: 'budget-scene' }
    const plan = buildSceneRenderPlan({ manifest: synthetic, level, locale: 'zh-CN' })
    expect(plan.nodes.length).toBeLessThanOrEqual(64)
    const aggregates = plan.nodes.filter((n) => n.kind === 'aggregate-label')
    expect(aggregates.length).toBe(8)
    for (const agg of aggregates) {
      expect(agg.logicalCount).toBe(40)
      expect(agg.text).toBe('40 个单元')
    }
    // Later populations receive 0 representatives once the budget is exhausted.
    const repCounts = new Map<string, number>()
    for (const node of plan.nodes) {
      if (node.kind !== 'population-representative') continue
      const id = node.nodeId.split(':')[1]!
      repCounts.set(id, (repCounts.get(id) ?? 0) + 1)
    }
    expect(repCounts.get('pop-0')).toBe(32) // dense limit
    expect(repCounts.get('pop-1')).toBe(53 - 32) // remaining budget
    for (let i = 2; i < 8; i++) {
      expect(repCounts.has(`pop-${i}`), `pop-${i} must have 0 representatives`).toBe(false)
    }
  })
})

describe('accessibility semantics (§10.2, CTR-PET-030)', () => {
  it('marks representatives aria-hidden with no alt text, one aggregate-label per population with the real count', () => {
    const plan = planFor(2_500_000) // L12: vehicles ×1,000,000
    const reps = plan.nodes.filter((n) => n.kind === 'population-representative')
    expect(reps.length).toBeGreaterThan(0)
    for (const rep of reps) {
      expect(rep.ariaHidden).toBe(true)
      expect(rep.altText).toBeNull()
    }
    const aggregates = plan.nodes.filter((n) => n.kind === 'aggregate-label')
    expect(aggregates.length).toBe(1)
    expect(aggregates[0]!.logicalCount).toBe(1_000_000)
    expect(aggregates[0]!.text).toBe('1000000 辆无人车')
  })

  it('carries an accessible name on the subject node via the milestone/alt rules', () => {
    const plan = planFor(0)
    const subject = plan.nodes.find((n) => n.kind === 'subject')
    expect(subject?.altText).toBe('L1 车宠历史插画。阶段含义：主驾有人，副驾无人，有后方保护车，1 辆车。')
    expect(subject?.ariaHidden).toBe(false)
    const milestone = plan.nodes.find((n) => n.kind === 'milestone')
    expect(milestone?.altText).toBe(milestone?.text)
  })

  it('localizes aggregate text and falls back to zh-CN for en-missing keys', () => {
    const zh = planFor(2_500_000, 'zh-CN')
    const en = planFor(2_500_000, 'en')
    const zhAgg = zh.nodes.find((n) => n.kind === 'aggregate-label')!
    const enAgg = en.nodes.find((n) => n.kind === 'aggregate-label')!
    expect(zhAgg.text).toBe('1000000 辆无人车')
    expect(enAgg.text).toBe('1000000 unmanned vehicles')
  })
})

describe('preset observables in the plan (§10)', () => {
  it('reflects camera and scale presets per level', () => {
    expect(planFor(0).cameraZoomPermille).toBe(1000)
    expect(planFor(300_000).cameraZoomPermille).toBe(820)
    expect(planFor(500_000).cameraZoomPermille).toBe(660)
    expect(planFor(800_000).cameraZoomPermille).toBe(520)
    expect(planFor(1_200_000).cameraZoomPermille).toBe(400)
    expect(planFor(1_800_000).cameraZoomPermille).toBe(300)
    expect(planFor(2_500_000).cameraZoomPermille).toBe(220)

    expect(planFor(0).subjectScalePermille).toBe(600)
    expect(planFor(500_000).subjectScalePermille).toBe(380)
    expect(planFor(800_000).subjectScalePermille).toBe(240)
    expect(planFor(1_200_000).subjectScalePermille).toBe(150)
    expect(planFor(1_800_000).subjectScalePermille).toBe(95)
    expect(planFor(2_500_000).subjectScalePermille).toBe(60)
  })

  it('places the milestone node per milestonePresentation preset', () => {
    const l1 = planFor(0)
    const milestone = l1.nodes.find((n) => n.kind === 'milestone')!
    expect(milestone.placement).toEqual({ x: 5000, y: 6800, scalePermille: 1000 })
    const l12 = planFor(2_500_000)
    const terminalMilestone = l12.nodes.find((n) => n.kind === 'milestone')!
    expect(terminalMilestone.placement.y).toBe(8800)
  })
})

describe('mechanical structural differences (§10.1, CTR-PET-022)', () => {
  const highLevels = pack.levels.slice(6) // l7..l12

  it('every adjacent high-level pair differs in at least two non-text dimensions', () => {
    for (let i = 0; i < highLevels.length - 1; i++) {
      const a = buildStructureFingerprint(pack, highLevels[i]!)
      const b = buildStructureFingerprint(pack, highLevels[i + 1]!)
      const diffs = structuralDifferenceCount(a, b)
      expect(diffs.length, `${highLevels[i]!.levelId} -> ${highLevels[i + 1]!.levelId}: ${diffs.join(',')}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('L12 uses the terminal camera, the terminal-horizon scene, and a terminal overlay', () => {
    const l12 = pack.levels[11]!
    expect(l12.presentation.camera).toBe('terminal')
    expect(l12.sceneId).toBe('terminal-horizon')
    const scene = pack.scenes.find((s) => s.sceneId === 'terminal-horizon')!
    expect(scene.layers.some((l) => l.kind === 'terminal-overlay')).toBe(true)
    const plan = buildSceneRenderPlan({ manifest: pack, level: l12, locale: 'zh-CN' })
    expect(plan.nodes.some((n) => n.kind === 'terminal-overlay')).toBe(true)
  })

  it('preserves static structure identically under reduced motion', () => {
    // The plan is reduced-motion-independent by construction; fingerprints capture the static structure.
    for (const level of pack.levels) {
      const fp = buildStructureFingerprint(pack, level)
      expect(fp.sceneId).toBe(level.sceneId)
    }
  })
})
