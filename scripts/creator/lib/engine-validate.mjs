/**
 * Engine validation bridge for the creator CLI (R2 fix round): bundles
 * `src/engine` once with esbuild (a devDependency) into
 * `scripts/creator/.build/engine-bundle.mjs` so the creator validator reuses
 * the REAL `validatePack` — ajv schema plus every semantic rule (ascending
 * thresholds, duplicate ids, asset references, keepsake back-references) —
 * instead of a shrunk copy. The bundle is deterministic tool output and is
 * rebuilt on demand when missing.
 */

import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const creatorLib = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(creatorLib, '../../..')
const buildDir = path.join(creatorLib, '.build')
const bundlePath = path.join(buildDir, 'engine-bundle.mjs')

export async function ensureEngineBundle() {
  if (!existsSync(bundlePath)) {
    await mkdir(buildDir, { recursive: true })
    await build({
      entryPoints: [path.join(repoRoot, 'src/engine/index.ts')],
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node20',
      outfile: bundlePath,
      logLevel: 'silent',
    })
    // esbuild leaves a companion file next to the output; keep the dir tidy.
    await writeFile(path.join(buildDir, '.gitignore'), '*\n')
  }
  return import(bundlePath)
}
