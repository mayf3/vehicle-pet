/**
 * Third-pet creator-path contracts (DSH_PET_OVERLAY_ADAPTER_V8 §17,
 * ACC-OVERLAY-135's mechanical core): THIRD_PARTY_NO_CORE_EDIT_ACCEPTANCE,
 * PET_DEFINITION_SCHEMA_CHECK, PET_DEFINITION_UNKNOWN_FIELD_FAIL_CHECK,
 * PET_DEFINITION_BAD_ASSET_FAIL_CHECK.
 *
 * The orb fixture pet was produced exactly the way a creator would: a new
 * data directory under `src/dsh/client/pets/` plus a new journey pack under
 * `src/packs/`. These tests mechanically pin that no core surface needed to
 * know about it.
 */

import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { petPresentations } from '../../src/dsh/client/pets/bundled'
import { resolvePetPackId } from '../../src/dsh/client/engine-bundles'
import { discoverPackBundles } from '../../src/packs/bundledRegistry'
import { validateCreatorPet } from '../../scripts/creator/lib/validate-pet-core.mjs'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const FIXTURE_ID = 'orb'
/** Word-boundary match: 'orb' inside e.g. "forbidden" is not a pet reference. */
const petIdPattern = new RegExp(`\\b${FIXTURE_ID}\\b`)

/** Runtime/overlay core files that must stay pet-agnostic (wiring and pet
 * data directories are excluded: they are the creator's own surface). */
const CORE_SCAN_ROOTS = ['src/engine', 'src/react', 'src/prototype']
const CORE_CORE_FILES = [
  'src/dsh/client/VehiclePetOverlay.tsx',
  'src/dsh/client/CharacterVisual.tsx',
  'src/dsh/client/ExpressionLayer.tsx',
  'src/dsh/client/VehiclePetSpeech.tsx',
  'src/dsh/client/speech-rules.ts',
  'src/dsh/client/speech-catalog.ts',
  'src/dsh/client/ambient-rules.ts',
  'src/dsh/client/playful-reactions.tsx',
  'src/dsh/client/preferences.ts',
  'src/dsh/client/engine-bundles.ts',
  'src/dsh/client/VehiclePetSecondaryMenu.tsx',
]

function listSourceFiles(relativeRoot: string): string[] {
  const root = path.join(REPO_ROOT, relativeRoot)
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full)
    }
  }
  visit(root)
  return out
}

async function readRepoFile(relative: string): Promise<string> {
  return readFile(path.join(REPO_ROOT, relative), 'utf8')
}

describe('THIRD_PARTY_NO_CORE_EDIT_ACCEPTANCE (V8 ACC-135, mechanical core)', () => {
  it('keeps the fixture pet out of every core surface', async () => {
    const offenders: string[] = []
    for (const root of CORE_SCAN_ROOTS) {
      for (const file of listSourceFiles(root)) {
        const content = await readFile(file, 'utf8')
        if (petIdPattern.test(content)) offenders.push(path.relative(REPO_ROOT, file))
      }
    }
    for (const relative of CORE_CORE_FILES) {
      const content = await readRepoFile(relative)
      if (petIdPattern.test(content)) offenders.push(relative)
    }
    expect(offenders, offenders.join(', ')).toEqual([])
  })

  it('wires the fixture pet only through generated discovery', async () => {
    const wired = await readRepoFile('src/dsh/client/pets/wired.generated.ts')
    expect(wired).toContain('orb')
    for (const relative of CORE_CORE_FILES) {
      const content = await readRepoFile(relative)
      expect(content.includes(`${FIXTURE_ID}Presentation`), relative).toBe(false)
    }
  })
})

describe('PET_DEFINITION_SCHEMA_CHECK (V8 CTR-038/040/041)', () => {
  it('structurally validates every wired pet presentation', () => {
    expect(petPresentations.length).toBeGreaterThanOrEqual(3)
    const ids = new Set<string>()
    for (const pet of petPresentations) {
      expect(ids.has(pet.id)).toBe(false)
      ids.add(pet.id)
      expect(pet.id).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(['engine-scene', 'pose-sprite']).toContain(pet.recipe)
      expect(pet.gradeLevels.length).toBeGreaterThan(0)
      expect(pet.displayName['zh-CN'].length).toBeGreaterThan(0)
      expect(pet.displayName.en.length).toBeGreaterThan(0)
      expect(pet.speech['idle']?.length ?? 0).toBeGreaterThan(0)
      expect(pet.license.license).toBeTruthy()
      expect(existsSync(path.join(REPO_ROOT, pet.license.provenance)), pet.license.provenance).toBe(true)
      if (pet.recipe === 'pose-sprite') {
        const poses = pet.poseSprite?.poses ?? []
        expect(poses.length).toBeGreaterThan(0)
        expect(pet.poseSprite?.alphaBounds.length).toBe(poses.length)
      }
    }
  })

  it('binds every pet to a discoverable journey pack', () => {
    const packIds = new Set(discoverPackBundles().map(bundle => (bundle.manifestCandidate as { packId?: string }).packId))
    for (const pet of petPresentations) {
      expect(packIds.has(pet.packId), `${pet.id} -> ${pet.packId}`).toBe(true)
      expect(resolvePetPackId(pet.id)).toBe(pet.packId)
    }
  })
})

describe('PET_DEFINITION_UNKNOWN_FIELD_FAIL_CHECK + PET_DEFINITION_BAD_ASSET_FAIL_CHECK', () => {
  it('rejects an unknown manifest field with the exact instance path', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vp-pet-check-'))
    try {
      await cp(path.join(REPO_ROOT, 'examples/minimal-pet'), dir, { recursive: true })
      const manifestPath = path.join(dir, 'journey/manifest.json')
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
      manifest.totallyUnknownField = { evil: true }
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
      const result = await validateCreatorPet(dir, { repoRoot: REPO_ROOT })
      expect(result.ok).toBe(false)
      expect(result.errors.some(error => error.includes('totallyUnknownField'))).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('rejects a manifest asset whose file is missing, naming the asset', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vp-pet-check-'))
    try {
      await cp(path.join(REPO_ROOT, 'examples/minimal-pet'), dir, { recursive: true })
      const manifestPath = path.join(dir, 'journey/manifest.json')
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
      manifest.assets[0]!.path = 'assets/orb-fixture/not-there.webp'
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
      const result = await validateCreatorPet(dir, { repoRoot: REPO_ROOT })
      expect(result.ok).toBe(false)
      expect(result.errors.some(error => error.includes('not-there.webp'))).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('rejects a pet whose speech catalog misses a required session state', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'vp-pet-check-'))
    try {
      await cp(path.join(REPO_ROOT, 'examples/minimal-pet'), dir, { recursive: true })
      const speechPath = path.join(dir, 'pet/speech.json')
      const speech = JSON.parse(await readFile(speechPath, 'utf8'))
      delete speech.completed
      await writeFile(speechPath, JSON.stringify(speech, null, 2))
      const result = await validateCreatorPet(dir, { repoRoot: REPO_ROOT })
      expect(result.ok).toBe(false)
      expect(result.errors.some(error => error.includes('/completed'))).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
