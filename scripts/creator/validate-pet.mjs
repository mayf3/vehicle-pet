/**
 * `pnpm pet:validate <dir>` — validate a creator pet directory (V8 CTR-038).
 * Prints one exact error per line; exit 0 only when the pet is valid.
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateCreatorPet } from './lib/validate-pet-core.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const target = process.argv[2]

if (target === undefined) {
  console.error('usage: pnpm pet:validate <pet-directory>')
  console.error('  e.g. pnpm pet:validate examples/minimal-pet')
  process.exit(2)
}

const petDir = path.resolve(process.cwd(), target)
const result = await validateCreatorPet(petDir, { repoRoot })
if (!result.ok) {
  console.error(`pet validation FAILED for ${path.relative(repoRoot, petDir)} (${result.errors.length} error${result.errors.length === 1 ? '' : 's'}):`)
  for (const error of result.errors) console.error(`  - ${error}`)
  process.exit(1)
}
console.log(`pet validation PASS: ${path.relative(repoRoot, petDir)}`)
