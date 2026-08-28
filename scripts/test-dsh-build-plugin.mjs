/** Rebuild only the browser bundle for pinned-Harness HMR acceptance. */
import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generation = process.argv[2] ?? 'production'
const e2eProgress = generation.startsWith('e2e-r3-active-')
const fixture = path.join(repoRoot, 'tests/dsh/e2e/fixtures/OverlayProgressSource.e2e.ts')

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
    js: 'window.__ModuleLoader__.load({ id: "@mayf3/vehicle-pet", factory: (require) => { var module = { exports: {} }; var exports = module.exports;',
  },
  footer: { js: 'return module.exports; } });' },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    '__VEHICLE_PET_CLIENT_GENERATION__': JSON.stringify(generation),
  },
  plugins: e2eProgress ? [{
    name: 'vehicle-pet-e2e-progress-source',
    setup(context) {
      context.onResolve({ filter: /^\.\/OverlayProgressSource$/ }, args => (
        args.importer.endsWith(`${path.sep}VehiclePetOverlay.tsx`) ? { path: fixture } : undefined
      ))
    },
  }] : [],
})

console.log(`DSH E2E client generation built: ${generation}${e2eProgress ? ' (test progress fixture)' : ''}`)
