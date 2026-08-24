/**
 * Generate `src/dsh/client/asset-bundles.generated.ts`: the deterministic
 * DSH build-time asset map. Keys are `<packId>/<manifest asset path>` for every
 * asset referenced by the two bundled Pack manifests — exactly those, no more
 * (unreferenced files rejected) and no fewer (missing assets rejected). The
 * generated module imports the SAME asset files the standalone prototype uses
 * (no second manifest, no copied thresholds); the DSH client build inlines the
 * bytes as data URLs. `--check` regenerates and byte-compares.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(repoRoot, 'src/dsh/client/asset-bundles.generated.ts')
const packs = ['autonomous-fleet', 'seedling-fixture']

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
  return [
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
  ].join('\n')
}

const check = process.argv.includes('--check')
const content = await generate()
if (!check) {
  await writeFile(outputPath, content, 'utf8')
  console.log(`generated ${path.relative(repoRoot, outputPath)} (${content.split('\n').length} lines)`)
} else {
  const current = await readFile(outputPath, 'utf8')
  if (current !== content) {
    console.error('asset-bundles.generated.ts is stale or inconsistent with the Pack manifests')
    console.error('run: pnpm assets:dsh-generate')
    process.exitCode = 1
  } else {
    console.log('DSH asset map matches the Pack manifests exactly')
  }
}
