/**
 * Build the DSH plugin artifacts (CTR-OVERLAY-001, CTR-OVERLAY-009):
 *
 * - lib/index.js  — Host entry: ESM, node, all packages external (inert).
 * - lib/client.js — Client entry: CJS browser bundle wrapped in the Harness
 *   `window.__ModuleLoader__.load` factory form, with react / react/jsx-runtime
 *   as the ONLY runtime externals (host-provided React identity; no second
 *   React, no ReactDOM, no createRoot). Pack assets are inlined as data URLs
 *   through the generated asset map — no Vite dev server, no import.meta.glob,
 *   no runtime remote asset request.
 * - lib/types/**  — emitted declarations (tsconfig.dsh.json).
 *
 * Output is deterministic for a pinned esbuild version; check-dsh-bundle.mjs
 * verifies determinism by rebuilding and byte-comparing.
 */

import { rm, mkdir } from 'node:fs/promises'
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_ID = '@mayf3/vehicle-pet'
const CLIENT_GENERATION = process.env.VEHICLE_PET_CLIENT_GENERATION ?? 'production'

await rm(path.join(repoRoot, 'lib'), { recursive: true, force: true })
await mkdir(path.join(repoRoot, 'lib'), { recursive: true })

await build({
  entryPoints: [path.join(repoRoot, 'src/dsh/index.ts')],
  outfile: path.join(repoRoot, 'lib/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
  legalComments: 'none',
})

await build({
  entryPoints: [path.join(repoRoot, 'src/dsh/client/index.ts')],
  outfile: path.join(repoRoot, 'lib/client.js'),
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: ['chrome120', 'firefox121', 'safari17'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  loader: { '.webp': 'dataurl', '.png': 'dataurl' },
  sourcemap: true,
  minify: true,
  legalComments: 'none',
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: { js: 'return module.exports; } });' },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    '__VEHICLE_PET_CLIENT_GENERATION__': JSON.stringify(CLIENT_GENERATION),
  },
})

execFileSync(process.execPath, [
  path.join(repoRoot, 'node_modules/typescript/bin/tsc'),
  '-p',
  path.join(repoRoot, 'tsconfig.dsh.json'),
], { stdio: 'inherit', cwd: repoRoot })

console.log('DSH plugin built: lib/index.js, lib/client.js, lib/types')
