/**
 * Generate the bundled pet wiring from declarative data (V8 CTR-038; R3 fix
 * round): every `src/dsh/client/pets/<petId>/pet.json` is the single source
 * of truth for a pet, and this tool emits
 *
 *   src/dsh/client/pets/<petId>/<petId>-wiring.generated.ts
 *     — the TypeScript module the registry imports, built ONLY from
 *       pet.json + levels.json + speech.json + scanned asset files;
 *
 *   src/dsh/client/pets/wired.generated.ts
 *     — the registry list (default pet first, then ids alphabetically).
 *
 * Pet authors supply data and images; all executable wiring is tool output
 * ("generated import/bundle" per the Goal dispatch). `--check` regenerates
 * and byte-compares both levels, so a hand-edited generated file is caught.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const petsDir = path.join(repoRoot, 'src/dsh/client/pets')
const DEFAULT_PET_ID = 'vehicle'
const check = process.argv.includes('--check')

const camelize = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

/** Deterministic alpha bounds [x0,y0,x1,y1] of a pose image. */
async function measureAlphaBounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x
        if (y < y0) y0 = y
        if (x + 1 > x1) x1 = x + 1
        if (y + 1 > y1) y1 = y + 1
      }
    }
  }
  return [x0, y0, x1, y1]
}

async function listPoseFiles(dir) {
  const entries = await readdir(dir)
  const index = (name) => Number(name.match(/^pose-(\d+)\./)?.[1] ?? -1)
  const pngs = entries.filter((n) => /^pose-\d+\.png$/.test(n)).sort((a, b) => index(a) - index(b))
  const webps = entries.filter((n) => /^pose-\d+\.webp$/.test(n)).sort((a, b) => index(a) - index(b))
  return { pngs, webps }
}

async function emitPetWiring(petId) {
  const petDir = path.join(petsDir, petId)
  const pet = JSON.parse(await readFile(path.join(petDir, 'pet.json'), 'utf8'))
  if (pet.id !== petId) {
    throw new Error(`pet id mismatch: directory ${petId} declares id ${pet.id}`)
  }
  const levels = JSON.parse(await readFile(path.join(petDir, 'levels.json'), 'utf8'))
  const speech = JSON.parse(await readFile(path.join(petDir, 'speech.json'), 'utf8'))
  const binding = `${camelize(petId)}Presentation`
  const lines = [
    '/**',
    ' * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.',
    ` * Wiring for pet '${petId}', emitted from pet.json + levels.json +`,
    ' * speech.json + scanned asset files only (V8 CTR-038; the data files are',
    ' * the source of truth and this module is tool output).',
    ' */',
    '',
  ]
  const poseSprite = pet.poseSprite
  if (poseSprite !== undefined) {
    const src = poseSprite.poseSource
    if (src.kind === 'module') {
      const names = [src.poses, src.alphaBounds, src.insigniaAssets, src.insigniaAnchors].filter(Boolean)
      lines.push(`import { ${names.join(', ')} } from '${src.path}'`)
    } else {
      const absDir = path.join(petDir, src.dir.replace(/^\.\//, ''))
      const { pngs, webps } = await listPoseFiles(absDir)
      if (pngs.length === 0 || pngs.length !== webps.length) {
        throw new Error(`pet ${petId}: pose assets must be pose-N.png/.webp pairs in ${src.dir} (got ${pngs.length} png / ${webps.length} webp)`)
      }
      const alphaBounds = []
      pngs.forEach((png, i) => lines.push(`import p${i} from '${src.dir}/${png}'`))
      webps.forEach((webp, i) => lines.push(`import w${i} from '${src.dir}/${webp}'`))
      for (const png of pngs) {
        alphaBounds.push(await measureAlphaBounds(path.join(absDir, png)))
      }
      lines.push(`const alphaBounds = ${JSON.stringify(alphaBounds)} as const`)
      lines.push(`const poses = [`)
      pngs.forEach((_, i) => lines.push(`  { png: p${i}, webp: w${i} },`))
      lines.push(`] as const`)
    }
    const insignia = poseSprite.insignia
    if (insignia !== undefined && insignia.assetSource.kind === 'files') {
      const isrc = insignia.assetSource
      const absDir = path.join(petDir, isrc.dir.replace(/^\.\//, ''))
      const svgs = (await readdir(absDir)).filter((n) => /^l\d+\.svg$/.test(n))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      if (svgs.length === 0) throw new Error(`pet ${petId}: wearable insignia needs l<N>.svg files in ${isrc.dir}`)
      svgs.forEach((svg, i) => lines.push(`import gi${i} from '${isrc.dir}/${svg}'`))
      lines.push(`const insigniaAssets = [${svgs.map((_, i) => `gi${i}`).join(', ')}] as const`)
    }
  }
  lines.push(`import type { PetPresentation } from '../types'`)
  lines.push('')
  lines.push(`export const ${binding}: PetPresentation = {`)
  lines.push(`  id: ${JSON.stringify(pet.id)},`)
  lines.push(`  displayName: ${JSON.stringify(pet.displayName)},`)
  lines.push(`  recipe: ${JSON.stringify(pet.recipe)},`)
  lines.push(`  packId: ${JSON.stringify(pet.packId)},`)
  lines.push(`  userSelectable: ${JSON.stringify(pet.userSelectable)},`)
  lines.push(`  gradePolicy: ${JSON.stringify(pet.gradePolicy)},`)
  lines.push(`  gradeLevels: ${JSON.stringify(levels)},`)
  lines.push(`  behavior: ${JSON.stringify(pet.behavior)},`)
  lines.push(`  speech: ${JSON.stringify(speech)},`)
  lines.push(`  license: ${JSON.stringify(pet.license)},`)
  if (poseSprite !== undefined) {
    const src = poseSprite.poseSource
    const moduleMode = src.kind === 'module'
    lines.push(`  poseSprite: {`)
    lines.push(`    variantPose: ${JSON.stringify(poseSprite.variantPose)},`)
    if (moduleMode) {
      lines.push(`    poses: ${src.poses},`)
      lines.push(`    alphaBounds: ${src.alphaBounds},`)
    } else {
      lines.push(`    poses,`)
      lines.push(`    alphaBounds,`)
    }
    const insignia = poseSprite.insignia
    if (insignia === undefined) {
      lines.push(`    insignia: undefined,`)
    } else {
      const isrc = insignia.assetSource
      lines.push(`    insignia: {`)
      lines.push(`      mode: 'wearable',`)
      if (isrc.kind === 'module') {
        lines.push(`      assets: ${isrc.insigniaAssets},`)
        lines.push(`      anchors: ${isrc.insigniaAnchors},`)
      } else {
        lines.push(`      assets: insigniaAssets,`)
        lines.push(`      anchors: alphaBounds.map(() => [50, 46, 0] as const),`)
      }
      lines.push(`    },`)
    }
    lines.push(`  },`)
  }
  if (pet.engineScene !== undefined) {
    lines.push(`  engineScene: ${JSON.stringify(pet.engineScene)},`)
  }
  lines.push(`}`)
  lines.push('')
  const outputPath = path.join(petDir, `${petId}-wiring.generated.ts`)
  return { outputPath, content: lines.join('\n'), binding, petId }
}

const entries = (await readdir(petsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && existsSync(path.join(petsDir, entry.name, 'pet.json')))
  .map((entry) => entry.name)
if (!entries.includes(DEFAULT_PET_ID)) {
  throw new Error(`bundled pet wiring: default pet '${DEFAULT_PET_ID}' is missing`)
}
const ordered = [DEFAULT_PET_ID, ...entries.filter((id) => id !== DEFAULT_PET_ID).sort()]

const modules = []
for (const petId of ordered) {
  modules.push(await emitPetWiring(petId))
}
const indexLines = [
  '/**',
  ' * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.',
  ' * Bundled pet wiring discovered from pets/<petId>/pet.json.',
  ' * Order: the documented default pet first, then ids alphabetically.',
  ' */',
  '',
  ...modules.map((m) => `import { ${m.binding} } from './${m.petId}/${m.petId}-wiring.generated'`),
  '',
  `import type { PetPresentation } from './types'`,
  '',
  `export const wiredPetPresentations: readonly PetPresentation[] = [`,
  ...modules.map((m) => `  ${m.binding},`),
  `]`,
  '',
]

async function byteEqual(target, content) {
  if (!existsSync(target)) return false
  return (await readFile(target, 'utf8')) === content
}

if (check) {
  let mismatch = false
  for (const m of modules) {
    if (!(await byteEqual(m.outputPath, m.content))) {
      console.error(`byte-mismatch: ${path.relative(repoRoot, m.outputPath)}`)
      mismatch = true
    }
  }
  const indexPath = path.join(petsDir, 'wired.generated.ts')
  if (!(await byteEqual(indexPath, indexLines.join('\n')))) {
    console.error('byte-mismatch: pets/wired.generated.ts')
    mismatch = true
  }
  if (mismatch) {
    console.error('pet wiring drift: run `node scripts/generate-pet-wiring.mjs`')
    process.exit(1)
  }
  console.log('pet wiring check: OK (byte-identical)')
} else {
  for (const m of modules) await writeFile(m.outputPath, m.content)
  await writeFile(path.join(petsDir, 'wired.generated.ts'), indexLines.join('\n'))
  console.log(`generated pet wiring for: ${ordered.join(', ')}`)
}
