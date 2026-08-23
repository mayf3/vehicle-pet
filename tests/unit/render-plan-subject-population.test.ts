import { describe, expect, it } from 'vitest'
import { buildSceneRenderPlan, type PetPackManifestV1 } from '../../src/engine'
import { fixturePackBundle } from '../helpers/fixtures'

describe('subject layer accessibility with a population', () => {
  it('retains the subject visual/accessibility node while allocating its representatives', () => {
    const manifest = structuredClone(fixturePackBundle().manifestCandidate) as PetPackManifestV1
    const scene = manifest.scenes[0]!
    const subject = scene.layers.find((layer) => layer.kind === 'subject')!
    subject.population = {
      populationId: 'subject-companions',
      logicalCount: 40,
      assetId: 'sprite-flower',
      density: 'dense',
      placement: 'ring',
      aggregateLabel: { 'zh-CN': '位伙伴', en: 'companions' },
    }

    const plan = buildSceneRenderPlan({ manifest, level: manifest.levels[0]!, locale: 'en' })
    const subjectNode = plan.nodes.find((node) => node.kind === 'subject')
    const representatives = plan.nodes.filter((node) => node.nodeId.startsWith('s-garden:subject-companions:') && node.kind === 'population-representative')

    expect(subjectNode?.assetId).toBe('sprite-flower')
    expect(subjectNode?.altText).toBe('a flower')
    expect(representatives.length).toBeGreaterThan(0)
    expect(representatives.length).toBeLessThanOrEqual(32)
    expect(plan.nodes.find((node) => node.nodeId === 's-garden:subject-companions:aggregate')?.text).toBe('40 companions')
  })
})
