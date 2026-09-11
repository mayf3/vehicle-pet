/**
 * Generate `src/dsh/client/pets/wired.generated.ts`: the bundled pet wiring.
 * Discovers every `src/dsh/client/pets/<petId>/definition.ts` by directory
 * scan (V8 CTR-OVERLAY-038) — adding a bundled pet means adding its data
 * directory and re-running the standard build commands, never editing runtime
 * or wiring TypeScript. Emission order: the documented default pet first,
 * then the remaining ids alphabetically (stable menu order).
 * `--check` regenerates and byte-compares.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(repoRoot, 'src/dsh/client/pets/wired.generated.ts')
const petsDir = path.join(repoRoot, 'src/dsh/client/pets')
const DEFAULT_PET_ID = 'vehicle'
const check = process.argv.includes('--check')

const entries = (await readdir(petsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && existsSync(path.join(petsDir, entry.name, 'definition.ts')))
  .map(entry => entry.name)
if (!entries.includes(DEFAULT_PET_ID)) {
  throw new Error(`bundled pet wiring: default pet '${DEFAULT_PET_ID}' is missing`)
}
const ordered = [DEFAULT_PET_ID, ...entries.filter(id => id !== DEFAULT_PET_ID).sort()]

// Identifier-safe binding: directory names may be hyphenated ids ("audit-pet")
// while the import binding must be a valid JS identifier ("auditPet").
const camelize = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const bindingFor = (id) => `${camelize(id)}Presentation`

const imports = ordered.map(id => `import { ${bindingFor(id)} } from './${id}/definition'`)
const list = ordered.map(id => `  ${bindingFor(id)},`)
const module = [
  '/**',
  ' * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.',
  ' * Bundled pet presentations discovered from pets/<petId>/definition.ts.',
  ' * Order: the documented default pet first, then ids alphabetically.',
  ' */',
  '',
  ...imports,
  '',
  'import type { PetPresentation } from \'./types\'',
  '',
  'export const wiredPetPresentations: readonly PetPresentation[] = [',
  ...list,
  ']',
  '',
].join('\n')

if (check) {
  const current = await readFile(outputPath, 'utf8')
  if (current !== module) {
    console.error('pet wiring drift: run `node scripts/generate-pet-wiring.mjs`')
    process.exit(1)
  }
  console.log('pet wiring check: OK (byte-identical)')
} else {
  await writeFile(outputPath, module)
  console.log(`generated pet wiring for: ${ordered.join(', ')}`)
}
