/**
 * Mechanical client-bundle gate (CTR-OVERLAY-001/008/009, ACC-OVERLAY-010):
 *
 * 1. required artifacts exist (host entry, client bundle, map, declarations);
 * 2. the Harness loader factory is present with the exact package id;
 * 3. React/ReactDOM runtime signatures are absent — React stays an external,
 *    host-provided identity; no createRoot/hydrateRoot ever appears;
 * 4. no DSH value imports leak into the browser artifact (type-only only);
 * 5. no import.meta.glob / Vite dev-server dependency;
 * 6. every Pack asset and every expression asset is inlined as a data URL and
 *    the counts match both generated maps exactly;
 * 7. no pet network path (fetch/XHR/WebSocket/EventSource), no iframe,
 *    no localhost:5199;
 * 8. the emitted bundle is byte-reproducible (rebuild + compare);
 * 9. the esbuild module graph lists react/react-jsx-runtime as the only
 *    external runtime modules.
 */

import { readFile, stat, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_ID = '@mayf3/vehicle-pet'
const failures = []

const requireArtifact = async relative => {
  try {
    await stat(path.join(repoRoot, relative))
  } catch {
    failures.push(`missing build artifact ${relative}`)
  }
}

for (const relative of [
  'lib/index.js',
  'lib/client.js',
  'lib/client.js.map',
  'lib/types/dsh/index.d.ts',
  'lib/types/dsh/client/index.d.ts',
]) {
  await requireArtifact(relative)
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join('\n'))
  process.exit(1)
}

const clientPath = path.join(repoRoot, 'lib/client.js')
const bundle = await readFile(clientPath, 'utf8')
// Scans run against code only: base64 asset payloads contain arbitrary
// substrings (e.g. "5199" inside a data URL), so strip them first.
const codeOnly = bundle.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, 'data:')

// 2. Loader factory registration with the exact package id.
if (!bundle.includes(`window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory:`)) {
  failures.push('Harness loader registration is missing or has the wrong id')
}

// 3. React singleton: externals only, no runtime code, no second root.
if (!/require\(.?["']react["']/.test(codeOnly)) {
  failures.push('react is not consumed as an external module (expected require("react"))')
}
if (/require\(.?["']react-dom/.test(codeOnly) || /react-dom\/client/.test(codeOnly)) {
  failures.push('react-dom leaked into the client bundle')
}
if (/react\.production\.min\.js|react\.development\.js|react-dom\.production/.test(codeOnly)) {
  failures.push('bundled React/ReactDOM runtime signature detected')
}
if (/createRoot|hydrateRoot/.test(codeOnly)) {
  failures.push('createRoot/hydrateRoot found in the client bundle')
}

// 4. No DSH value imports in the browser artifact.
if (/require\(.?["']@deepseek-ai\//.test(codeOnly)) {
  failures.push('a @deepseek-ai value import leaked into the client bundle')
}

// 5. No Vite/import.meta glob residue.
if (/import\.meta/.test(codeOnly)) {
  failures.push('import.meta (glob or url) leaked into the client bundle')
}

// 6. Data URL coverage matches the generated maps exactly: the Pack asset map
//    plus the V2 expression-asset map (CTR-OVERLAY-014 bundled presentation).
// V8 CTR-038: per-pet generated asset modules are discovered by scan, so a
// newly bundled pet's assets are gated by the same data-URL completeness rule
// without editing this script.
const { readdir } = await import('node:fs/promises')
const petsDir = path.join(repoRoot, 'src/dsh/client/pets')
const generatedAssetModules = [
  'src/dsh/client/asset-bundles.generated.ts',
  'src/dsh/client/expression-assets.generated.ts',
  'src/dsh/client/character-assets.generated.ts',
]
for (const petId of await readdir(petsDir)) {
  const candidate = path.join(petsDir, petId, `${petId}-assets.generated.ts`)
  if (existsSync(candidate)) generatedAssetModules.push(path.relative(repoRoot, candidate))
}
let generatedCount = 0
for (const modulePath of generatedAssetModules) {
  const module = await readFile(path.join(repoRoot, modulePath), 'utf8')
  generatedCount += (module.match(/^import /gm) ?? []).length
}
const dataUrlCount = (bundle.match(/data:image\/(?:webp|png);base64,|data:image\/svg\+xml[;,]/g) ?? []).length
if (generatedCount === 0) {
  failures.push('generated asset map is empty')
} else if (dataUrlCount !== generatedCount) {
  failures.push(`data URL count ${dataUrlCount} != generated asset count ${generatedCount}`)
}
if (!/data:image\/webp;base64,/.test(bundle) || !/data:image\/png;base64,/.test(bundle)) {
  failures.push('expected both WebP and PNG data URLs in the bundle')
}

// 7. Forbidden runtime paths.
if (/\bfetch\(|XMLHttpRequest|WebSocket|EventSource/.test(codeOnly)) {
  failures.push('network API (fetch/XHR/WebSocket/EventSource) found in the client bundle')
}
if (/iframe/.test(codeOnly)) {
  failures.push('iframe reference found in the client bundle')
}
if (/5199/.test(codeOnly)) {
  failures.push('port 5199 reference found in the client bundle')
}

// 7b. PUBLIC_BRAND_BUNDLE_CHECK (V8 CTR-039): the distributed client bundle
// must not carry a third-party company brand as product identity. Data URLs
// are excluded from the scan here; master rasters are gated separately by the
// asset pipeline review (CTR-042).
const brandSafeBundle = bundle.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '')
for (const brand of ['Pony.ai', 'pony.ai']) {
  if (brandSafeBundle.includes(brand)) {
    failures.push(`third-party brand "${brand}" found in the client bundle (PUBLIC_BRAND_BUNDLE_CHECK, V8 CTR-039)`)
  }
}

// 8. Byte determinism: rebuild both entries into a temp dir and compare.
const tempDir = await mkdtemp(path.join(tmpdir(), 'vehicle-pet-dsh-check-'))
try {
  const tempClient = path.join(tempDir, 'client.js')
  const tempHost = path.join(tempDir, 'index.js')
  const clientResult = await build({
    entryPoints: [path.join(repoRoot, 'src/dsh/client/index.ts')],
    outfile: tempClient,
    bundle: true,
    platform: 'browser',
    format: 'cjs',
    target: ['chrome120', 'firefox121', 'safari17'],
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
    loader: { '.webp': 'dataurl', '.png': 'dataurl', '.svg': 'dataurl' },
    sourcemap: false,
    minify: true,
    legalComments: 'none',
    write: false,
    metafile: true,
    banner: {
      js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
    },
    footer: { js: 'return module.exports; } });' },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      '__VEHICLE_PET_CLIENT_GENERATION__': JSON.stringify('production'),
    },
  })
  const hostResult = await build({
    entryPoints: [path.join(repoRoot, 'src/dsh/index.ts')],
    outfile: tempHost,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    packages: 'external',
    sourcemap: false,
    legalComments: 'none',
    write: false,
  })

  const rebuiltClient = clientResult.outputFiles.find(file => file.path === tempClient)
  const rebuiltHost = hostResult.outputFiles.find(file => file.path === tempHost)
  if (rebuiltClient === undefined || rebuiltHost === undefined) {
    failures.push('determinism rebuild produced no output')
  } else {
    const committedClient = await readFile(clientPath, 'utf8')
    const committedHost = await readFile(path.join(repoRoot, 'lib/index.js'), 'utf8')
    // The committed artifact carries a linked sourcemap comment; compare bodies.
    const stripMapComment = text => text.replace(/^\/\/# sourceMappingURL=.*$/m, '').replace(/\s+$/, '')
    if (stripMapComment(committedClient) !== stripMapComment(rebuiltClient.text)) {
      failures.push('lib/client.js is not byte-reproducible (stale or nondeterministic build)')
    }
    if (stripMapComment(committedHost) !== stripMapComment(rebuiltHost.text)) {
      failures.push('lib/index.js is not byte-reproducible (stale or nondeterministic build)')
    }
  }

  // 9. External module list from the metafile (keys are cwd-relative paths).
  const metaKey = path.relative(process.cwd(), tempClient)
  const outputMeta = clientResult.metafile.outputs[metaKey]
    ?? Object.values(clientResult.metafile.outputs).find(output => output.entryPoint !== undefined)
  if (outputMeta === undefined) {
    failures.push('metafile has no client entry output')
  } else {
    const externals = [...new Set(outputMeta.imports
      .map(entry => entry.path)
      .filter(name => !name.startsWith('.')))]
    const allowed = new Set(['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'])
    for (const name of externals) {
      if (!allowed.has(name)) failures.push(`unexpected external module in client bundle: ${name}`)
    }
    if (!externals.includes('react')) failures.push('react missing from the external module list')
  }
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join('\n'))
  process.exit(1)
}

const bytes = (await stat(clientPath)).size
console.log(`DSH client bundle OK: ${bytes} bytes, ${dataUrlCount} inlined assets, externals limited to react`)
