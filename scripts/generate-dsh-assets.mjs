/**
 * Generate `src/dsh/client/asset-bundles.generated.ts`: the deterministic
 * DSH build-time asset map. Keys are `<packId>/<manifest asset path>` for every
 * asset referenced by the two bundled Pack manifests — exactly those, no more
 * (unreferenced files rejected) and no fewer (missing assets rejected). The
 * generated module imports the SAME asset files the standalone prototype uses
 * (no second manifest, no copied thresholds); the DSH client build inlines the
 * bytes as data URLs. `--check` regenerates and byte-compares.
 *
 * Goal 灵动 (V3 CTR-OVERLAY-003): the same run also emits
 * `src/dsh/client/level-bbox.generated.ts`, the per-level visible-sprite
 * bounding box measured from the subject sprite PNG alpha channel. The
 * resident hitbox uses it to hug the visible art (transparent canvas margins
 * must not create pointer/focus area).
 */

import { readFile, writeFile, rm, mkdtemp, readFile as readFileBytes } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(repoRoot, 'src/dsh/client/asset-bundles.generated.ts')
const bboxOutputPath = path.join(repoRoot, 'src/dsh/client/level-bbox.generated.ts')
const packs = ['autonomous-fleet', 'seedling-fixture']

/** Level ids referenced by subject asset ids, keyed per pack: levelId → png repo path. */
async function collectSubjectBboxes() {
  const entries = {}
  const lines = []
  for (const packId of packs) {
    const manifest = JSON.parse(await readFile(path.join(repoRoot, 'src/packs', packId, 'manifest.json'), 'utf8'))
    for (const asset of manifest.assets) {
      if (!asset.assetId.startsWith('sprite-subject-') || asset.format !== 'png') continue
      const stem = asset.assetId.replace(/-png$/, '')
      const tokens = stem.split('-')
      const levelId = tokens[tokens.length - 1]
      if (levelId === undefined || !manifest.levels.some(level => level.levelId === levelId)) continue
      const file = path.join(repoRoot, 'src/packs', packId, asset.path)
      const img = sharp(file)
      const { width, height } = await img.metadata()
      const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
      const channels = info.channels
      const alphaOffset = channels === 2 ? 1 : 3
      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * channels + alphaOffset] > 8) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX < 0) throw new Error(`subject sprite has no opaque pixels: ${asset.path}`)
      entries[`${packId}/${levelId}`] = {
        leftPct: round2((minX / width) * 100),
        topPct: round2((minY / height) * 100),
        widthPct: round2(((maxX - minX + 1) / width) * 100),
        heightPct: round2(((maxY - minY + 1) / height) * 100),
      }
      lines.push(`  ${JSON.stringify(`${packId}/${levelId}`)}: ${JSON.stringify(entries[`${packId}/${levelId}`])},`)
    }
  }
  return lines
}

const round2 = (value) => Math.round(value * 100) / 100

function bboxModule(lines) {
  return [
    '/**',
    ' * GENERATED FILE — do not edit. Run `pnpm assets:dsh-generate`.',
    ' * Per-level visible sprite bounding box, measured from the subject sprite',
    ' * PNG alpha channel (V3 CTR-OVERLAY-003 hitbox honesty). Percentages of',
    ' * the square sprite canvas. A level missing from this map renders the',
    ' * fallback full-canvas hitbox.',
    ' */',
    '',
    'export interface LevelVisibleBbox {',
    '  readonly leftPct: number',
    '  readonly topPct: number',
    '  readonly widthPct: number',
    '  readonly heightPct: number',
    '}',
    '',
    'export const levelVisibleBbox: Readonly<Record<string, LevelVisibleBbox>> = {',
    ...lines,
    '}',
    '',
  ].join('\n')
}

async function generate() {
  const lines = []
  const entries = []
  let index = 0
  for (const packId of packs) {
    const manifest = JSON.parse(await readFile(path.join(repoRoot, 'src/packs', packId, 'manifest.json'), 'utf8'))
    if (manifest.packId !== packId) {
      throw new Error(`manifest packId mismatch: expected ${packId}, got ${manifest.packId}`)
    }
    for (const asset of manifest.assets) {
      const key = `${packId}/${asset.path}`
      const name = `asset${index}`
      lines.push(`import ${name} from '../../packs/${packId}/${asset.path}'`)
      entries.push(`  ${JSON.stringify(key)}: ${name},`)
      index += 1
    }
  }
  const bboxLines = await collectSubjectBboxes()
  return {
    assetModule: [
      '/**',
      ' * GENERATED FILE — do not edit. Run `pnpm assets:dsh-generate`.',
      ' * Deterministic DSH build-time asset map over the two bundled Pack',
      ' * manifests (same manifests and same asset files as the standalone',
      ' * prototype; the DSH client build inlines the bytes as data URLs).',
      ' * Gate: `pnpm assets:dsh-check` rejects missing and unreferenced assets.',
      ' */',
      '',
      ...lines,
      '',
      'export const dshAssetUrls: Readonly<Record<string, string>> = {',
      ...entries,
      '}',
      '',
    ].join('\n'),
    bboxModuleContent: bboxModule(bboxLines),
    assetCount: entries.length,
  }
}

async function byteEqual(aPath, content) {
  if (!existsSync(aPath)) return false
  const current = await readFileBytes(aPath)
  return current.equals(Buffer.from(content, 'utf8'))
}

const { assetModule, bboxModuleContent, assetCount } = await generate()
if (process.argv.includes('--check')) {
  const tmp = await mkdtemp(path.join(tmpdir(), 'vehicle-pet-dsh-assets-'))
  try {
    let mismatch = !(await byteEqual(outputPath, assetModule))
    if (mismatch) console.error('byte-mismatch: asset-bundles.generated.ts')
    if (!(await byteEqual(bboxOutputPath, bboxModuleContent))) {
      console.error('byte-mismatch: level-bbox.generated.ts')
      mismatch = true
    }
    if (mismatch) process.exit(1)
    console.log('dsh assets check: OK (byte-identical)')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
} else {
  await writeFile(outputPath, assetModule)
  await writeFile(bboxOutputPath, bboxModuleContent)
  console.log(`generated ${assetCount} asset imports + level bbox map`)
}
