/**
 * Creator pet validation core (V8 CTR-OVERLAY-038; Goal「开放」slice 3c).
 * Pure ESM shared by the `pnpm pet:validate` CLI and the contract tests.
 *
 * Validates a creator pet directory laid out as:
 *
 *   <dir>/pet/definition.ts      presentation manifest (template-provided)
 *   <dir>/pet/levels.json        grade descriptions per level id
 *   <dir>/pet/speech.json        bilingual speech catalog
 *   <dir>/pet/assets/*.png|webp  pose images (png+webp pairs)
 *   <dir>/journey/manifest.json  Engine Pet Pack manifest (ajv-validated)
 *   <dir>/journey/assets/...     journey art referenced by the manifest
 *   <dir>/LICENSE                license metadata contract
 *
 * Every failure names the exact file and field (ajv instancePath or a
 * structural path), so creators can fix data without reading core code.
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ajv = require('ajv')
const ajvFormats = require('ajv-formats')

const SPEECH_CATEGORIES = [
  'idle', 'working', 'needs-input', 'completed', 'failed', 'milestone', 'petting', 'welcome', 'ritual',
]
const CORE_SESSION_CATEGORIES = ['idle', 'working', 'needs-input', 'completed', 'failed', 'milestone']
const RECIPES = ['engine-scene', 'pose-sprite']
const THIRD_PARTY_BRANDS = ['Pony.ai', 'pony.ai']
const BAKED_NUMERAL_PATTERN = />\s*L\s*\d+\s*</

function loaderForRepoRoot(repoRoot) {
  const schemaPath = path.join(repoRoot, 'src/engine/schema/pet-pack-manifest-v1.schema.json')
  return async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
    const Ajv = ajv.default
    const validate = new Ajv({ allErrors: true, strict: false })
    ajvFormats.default(validate)
    return validate.compile(schema)
  }
}

async function fileExists(target) {
  try {
    return (await stat(target)).isFile()
  } catch {
    return false
  }
}

/**
 * Validate one creator pet directory. Returns { ok, errors } where every
 * error is a human-readable string pointing at an exact file/field.
 */
export async function validateCreatorPet(petDir, options = {}) {
  const errors = []
  const repoRoot = options.repoRoot ?? path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
  const petDirPath = path.join(petDir, 'pet')
  const journeyDir = path.join(petDir, 'journey')

  // 1. Layout.
  for (const required of ['pet/definition.ts', 'pet/levels.json', 'pet/speech.json', 'journey/manifest.json', 'LICENSE']) {
    if (!(await fileExists(path.join(petDir, required)))) {
      errors.push(`missing required file: ${required}`)
    }
  }
  if (errors.length > 0) return { ok: false, errors }

  // 2. Journey manifest: ajv against the Engine schema + asset existence.
  const compileSchema = options.compileSchema ?? loaderForRepoRoot(repoRoot)
  let manifest
  try {
    manifest = JSON.parse(await readFile(path.join(journeyDir, 'manifest.json'), 'utf8'))
  } catch (error) {
    return { ok: false, errors: [`journey/manifest.json is not valid JSON: ${error.message}`] }
  }
  const validateManifest = options.validateManifest ?? (await compileSchema())
  const valid = validateManifest(manifest)
  if (!valid) {
    for (const e of validateManifest.errors ?? []) {
      const field = e.params?.additionalProperty !== undefined ? ` (offending field: ${String(e.params.additionalProperty)})` : ''
      errors.push(`journey/manifest.json ${e.instancePath || '/'} ${e.message ?? 'failed schema validation'}${field}`)
    }
  } else {
    for (const asset of manifest.assets ?? []) {
      if (!(await fileExists(path.join(journeyDir, asset.path)))) {
        errors.push(`journey/manifest.json /assets missing file for assetId ${asset.assetId}: ${asset.path}`)
      }
    }
    const levelIds = new Set((manifest.levels ?? []).map(level => level.levelId))
    for (const keepsake of manifest.keepsakes ?? []) {
      if (!levelIds.has(keepsake.levelId)) {
        errors.push(`journey/manifest.json /keepsakes/${keepsake.keepsakeId} levelId ${keepsake.levelId} is not a declared level`)
      }
    }
  }

  // 3. Presentation data files.
  let levels
  let speech
  try {
    levels = JSON.parse(await readFile(path.join(petDirPath, 'levels.json'), 'utf8'))
  } catch (error) {
    errors.push(`pet/levels.json is not valid JSON: ${error.message}`)
  }
  try {
    speech = JSON.parse(await readFile(path.join(petDirPath, 'speech.json'), 'utf8'))
  } catch (error) {
    errors.push(`pet/speech.json is not valid JSON: ${error.message}`)
  }
  if (Array.isArray(levels)) {
    levels.forEach((level, index) => {
      if (typeof level.id !== 'string' || !/^l\d+$/.test(level.id)) {
        errors.push(`pet/levels.json /${index}/id must match /^l\\d+$/ (got ${JSON.stringify(level.id)})`)
      }
      for (const locale of ['zh-CN', 'en']) {
        if (typeof level[locale] !== 'string' || level[locale].length === 0) {
          errors.push(`pet/levels.json /${index}/${locale} must be a non-empty localized description`)
        }
      }
    })
  }
  if (speech !== undefined && typeof speech === 'object' && speech !== null) {
    for (const [category, lines] of Object.entries(speech)) {
      if (!SPEECH_CATEGORIES.includes(category)) {
        errors.push(`pet/speech.json /${category} is not a known speech category (allowed: ${SPEECH_CATEGORIES.join(', ')})`)
      }
      if (!Array.isArray(lines) || lines.length === 0) {
        errors.push(`pet/speech.json /${category} must be a non-empty array of bilingual lines`)
        continue
      }
      for (const [index, line] of lines.entries()) {
        for (const locale of ['zh-CN', 'en']) {
          if (typeof line?.[locale] !== 'string' || line[locale].length === 0) {
            errors.push(`pet/speech.json /${category}/${index}/${locale} must be a non-empty string`)
          }
        }
      }
    }
    for (const category of CORE_SESSION_CATEGORIES) {
      if (!Array.isArray(speech[category]) || speech[category].length < 1) {
        errors.push(`pet/speech.json /${category} must have at least 1 line (V8 CTR-018 floor for new pets)`)
      }
    }
  }

  // 4. Presentation manifest (definition.ts): structural + identity checks.
  const definition = await readFile(path.join(petDirPath, 'definition.ts'), 'utf8')
  const idMatch = definition.match(/id:\s*'([^']+)'/)
  if (idMatch === null) {
    errors.push("pet/definition.ts must declare id: '<your-pet-id>'")
  } else {
    const id = idMatch[1]
    if (id !== path.basename(petDir) && id !== 'my-pet') {
      errors.push(`pet/definition.ts id '${id}' should match the pet directory name '${path.basename(petDir)}'`)
    }
    if (['vehicle', 'companion'].includes(id)) {
      errors.push(`pet/definition.ts id '${id}' collides with a bundled reference pet; pick a distinct id`)
    }
  }
  const packMatch = definition.match(/packId:\s*'([^']+)'/)
  if (packMatch === null) {
    errors.push("pet/definition.ts must declare packId: '<your-pack-id>'")
  } else if (manifest !== undefined && packMatch[1] !== manifest.packId) {
    errors.push(`pet/definition.ts packId '${packMatch[1]}' must equal journey/manifest.json packId '${manifest.packId}'`)
  }
  if (!/recipe:\s*'(engine-scene|pose-sprite)'/.test(definition)) {
    errors.push(`pet/definition.ts must declare recipe: one of ${RECIPES.join(' | ')}`)
  }
  for (const field of ['gradePolicy', 'license']) {
    if (!definition.includes(field)) errors.push(`pet/definition.ts must declare ${field} (V8 CTR-038/040 metadata contract)`)
  }
  if (!/showExactLevelNumber/.test(definition) || !/insigniaMode/.test(definition)) {
    errors.push('pet/definition.ts gradePolicy must declare showExactLevelNumber, showDescription, and insigniaMode (V8 CTR-040)')
  }
  // The wiring generator derives the import binding as camelize(<id>) + 
  // 'Presentation'; a mismatched export fails at build pointing at a
  // generated file, so name the convention here instead.
  if (idMatch !== null) {
    const expectedExport = `${idMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Presentation`
    if (!definition.includes(`export const ${expectedExport}`)) {
      errors.push(`pet/definition.ts must export const ${expectedExport} (camelCase of id '${idMatch[1]}', consumed by the generated wiring)`)
    }
  }

  // 5. Brand / baked-numeral hygiene on the creator's own files (CTR-039/042).
  const dataFiles = ['pet/definition.ts', 'pet/levels.json', 'pet/speech.json', 'journey/manifest.json', 'LICENSE']
  for (const relative of dataFiles) {
    const content = await readFile(path.join(petDir, relative), 'utf8')
    for (const brand of THIRD_PARTY_BRANDS) {
      if (content.includes(brand)) errors.push(`${relative} contains third-party brand "${brand}" (V8 CTR-039)`)
    }
  }
  const assetDir = path.join(petDirPath, 'assets')
  if (existsSync(assetDir)) {
    for (const name of (await readdir(assetDir)).filter(name => name.endsWith('.svg'))) {
      const content = await readFile(path.join(assetDir, name), 'utf8')
      if (BAKED_NUMERAL_PATTERN.test(content)) {
        errors.push(`pet/assets/${name} contains a visible baked level numeral (V8 CTR-042)`)
      }
      for (const brand of THIRD_PARTY_BRANDS) {
        if (content.includes(brand)) errors.push(`pet/assets/${name} contains third-party brand "${brand}" (V8 CTR-042)`)
      }
    }
  }

  return { ok: errors.length === 0, errors }
}
