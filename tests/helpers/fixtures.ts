/**
 * Shared test fixtures. Test files may contain domain vocabulary freely —
 * the domain-word prohibition applies to production engine/react code only.
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { PackBundleInput, PetPackManifestV1 } from '../../src/engine'
import { MemoryPetStorageAdapter } from '../../src/engine'

export const FLEET_PACK_DIR = path.resolve(import.meta.dirname, '../../src/packs/autonomous-fleet')

export function fleetManifest(): PetPackManifestV1 {
  return JSON.parse(readFileSync(path.join(FLEET_PACK_DIR, 'manifest.json'), 'utf8')) as PetPackManifestV1
}

export function fleetBundle(): PackBundleInput {
  const manifest = fleetManifest()
  return {
    manifestCandidate: manifest,
    resolveAssetUrl: (p: string) => (existsSync(path.join(FLEET_PACK_DIR, p)) ? `/mock/${p}` : undefined),
  }
}

/** A minimal valid second-domain pack proving engine neutrality. */
export function fixturePackBundle(overrides: Partial<PetPackManifestV1> = {}): PackBundleInput {
  const manifest = {
    schemaVersion: 1,
    packId: 'fixture-garden',
    packVersion: '1.0.0',
    name: { 'zh-CN': '测试花园', en: 'Fixture Garden' },
    levels: [
      {
        levelId: 'bud',
        threshold: 0,
        stageName: { 'zh-CN': '花苞', en: 'Bud' },
        summary: { 'zh-CN': '一颗花苞。', en: 'A bud.' },
        milestone: { 'zh-CN': '花苞初现。', en: 'A bud appears.' },
        sceneId: 's-garden',
        presentation: { scale: 'individual', camera: 'close', milestone: 'inline' },
      },
      {
        levelId: 'bloom',
        threshold: 100,
        stageName: { 'zh-CN': '绽放', en: 'Bloom' },
        summary: { 'zh-CN': '第一朵花开了。', en: 'The first flower blooms.' },
        milestone: { 'zh-CN': '花园里第一朵花。', en: 'First flower in the garden.' },
        sceneId: 's-garden',
        presentation: { scale: 'group', camera: 'city', milestone: 'inline' },
        upgrade: { transition: 'crossfade', reveal: 'subject-swap', celebration: 'glow-pulse' },
        keepsakeId: 'ks-bloom',
      },
    ],
    scenes: [
      {
        sceneId: 's-garden',
        backgroundAssetId: 'bg-garden',
        layers: [
          {
            layerId: 'flowers',
            kind: 'decoration',
            population: {
              populationId: 'flowers',
              logicalCount: 5,
              assetId: 'sprite-flower',
              density: 'sparse',
              placement: 'ring',
              aggregateLabel: { 'zh-CN': '朵花', en: 'flowers' },
            },
            placement: 'center',
            zOrder: 10,
          },
          { layerId: 'main-subject', kind: 'subject', assetId: 'sprite-flower', placement: 'center', zOrder: 20 },
        ],
        transition: 'crossfade',
        sceneLabel: { 'zh-CN': '小花园', en: 'Small garden' },
      },
    ],
    assets: [
      {
        assetId: 'bg-garden',
        path: 'assets/fixture-garden/bg-garden.webp',
        format: 'webp',
        role: 'background',
        width: 1600,
        height: 900,
        byteSizeCompressed: 1000,
        altText: { 'zh-CN': '花园背景', en: 'Garden background' },
      },
      {
        assetId: 'bg-garden-png',
        path: 'assets/fixture-garden/bg-garden.png',
        format: 'png',
        role: 'background',
        width: 1600,
        height: 900,
        byteSizeCompressed: 1000,
        altText: { 'zh-CN': '花园背景', en: 'Garden background' },
      },
      {
        assetId: 'sprite-flower',
        path: 'assets/fixture-garden/sprite-flower.webp',
        format: 'webp',
        role: 'sprite',
        width: 320,
        height: 320,
        byteSizeCompressed: 500,
        altText: { 'zh-CN': '一朵花', en: 'a flower' },
      },
      {
        assetId: 'sprite-flower-png',
        path: 'assets/fixture-garden/sprite-flower.png',
        format: 'png',
        role: 'sprite',
        width: 320,
        height: 320,
        byteSizeCompressed: 500,
        altText: { 'zh-CN': '一朵花', en: 'a flower' },
      },
    ],
    keepsakes: [
      {
        keepsakeId: 'ks-bloom',
        levelId: 'bloom',
        title: { 'zh-CN': '初花书签', en: 'First Bloom Bookmark' },
        accessDescription: { 'zh-CN': '纪念第一朵花。', en: 'Marks the first flower.' },
        assetId: 'sprite-flower',
      },
    ],
    ...overrides,
  } as PetPackManifestV1
  return {
    manifestCandidate: manifest,
    resolveAssetUrl: (p: string) => `/mock-fixture/${p}`,
  }
}

/** Storage adapter whose claim operations fail on demand (CTR-PET-013 failure path). */
export class FailingClaimsStorage extends MemoryPetStorageAdapter {
  public failClaims = false

  override async claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<'won' | 'lost'> {
    if (this.failClaims) throw new Error('simulated storage failure')
    return super.claimReceipt(sourceId, subjectId, receiptId)
  }

  override async claimReceiptBatch(sourceId: string, subjectId: string, receiptIds: string[]): Promise<'won' | 'lost'> {
    if (this.failClaims) throw new Error('simulated storage failure')
    return super.claimReceiptBatch(sourceId, subjectId, receiptIds)
  }
}

export function snapshot(points: number, revision: number, subjectId = 'subject-1', sourceId = 'mock-progress') {
  return {
    schemaVersion: 1 as const,
    sourceId,
    subjectId,
    progressPoints: points,
    revision,
    observedAt: '2026-08-22T00:00:00Z',
  }
}

export const FLEET_THRESHOLDS = [0, 10_000, 30_000, 60_000, 100_000, 180_000, 300_000, 500_000, 800_000, 1_200_000, 1_800_000, 2_500_000]
