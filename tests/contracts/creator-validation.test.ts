/**
 * Creator validator negative matrix (R2 fix round): malformed creator input
 * MUST be rejected with an exact-field error and MUST NOT throw. The cases
 * mirror the independent review's counterexamples (false-green bugs) plus
 * the R3/R7 follow-ups (no executable definition file, unimplemented
 * insignia mode, out-of-range pose indices, non-ascending journey
 * thresholds via the REAL engine validator).
 */

import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { validateCreatorPet } from '../../scripts/creator/lib/validate-pet-core.mjs'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
let workDir: string
let baseDir: string
let caseDir: string

beforeAll(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'vp-creator-neg-'))
  baseDir = path.join(workDir, 'base')
  await cp(path.join(REPO_ROOT, 'examples/minimal-pet'), baseDir, { recursive: true })
  caseDir = path.join(workDir, 'case')
})

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true })
})

async function runCase(mutate: () => Promise<void>) {
  await rm(caseDir, { recursive: true, force: true })
  await cp(baseDir, caseDir, { recursive: true })
  await mutate()
  return validateCreatorPet(caseDir, { repoRoot: REPO_ROOT })
}

const W = (relative: string, content: string) => writeFile(path.join(caseDir, relative), content)
const J = async (relative: string) => JSON.parse(await readFile(path.join(caseDir, relative), 'utf8')) as Record<string, never>

async function expectRejected(mutate: () => Promise<void>, needle: string) {
  const result = await runCase(mutate)
  expect(result.ok, JSON.stringify(result.errors)).toBe(false)
  expect(result.errors.some((error) => error.includes(needle)), result.errors.join(' | ')).toBe(true)
}

describe('CREATOR_VALIDATION_NEGATIVE_MATRIX (R2 fix round)', () => {
  it('rejects a non-object pet.json with schema errors', async () => {
    await expectRejected(() => W('pet/pet.json', '7'), 'must be object')
    await expectRejected(() => W('pet/pet.json', '{}'), "required property 'id'")
  })

  it('rejects non-array / empty / malformed levels', async () => {
    await expectRejected(() => W('pet/levels.json', '{}'), 'non-empty array')
    await expectRejected(() => W('pet/levels.json', '[null]'), 'must be an object')
    await expectRejected(
      () => W('pet/levels.json', JSON.stringify([{ id: 'l1', 'zh-CN': 'a', en: 'a' }, { id: 'l1', 'zh-CN': 'b', en: 'b' }])),
      'duplicate level id l1',
    )
  })

  it('rejects a non-object speech catalog', async () => {
    await expectRejected(() => W('pet/speech.json', '7'), 'object mapping speech categories')
  })

  it('rejects missing pose assets for pose-sprite pets', async () => {
    await expectRejected(() => rm(path.join(caseDir, 'pet/assets'), { recursive: true }), 'does not exist')
  })

  it('rejects an empty LICENSE', async () => {
    await expectRejected(() => W('LICENSE', ''), 'LICENSE is empty')
  })

  it('rejects a dangling license.provenance pointer', async () => {
    await expectRejected(async () => {
      const pet = await J('pet/pet.json') as unknown as { license: { provenance: string } }
      pet.license.provenance = 'nope.json'
      await W('pet/pet.json', JSON.stringify(pet))
    }, "provenance 'nope.json' does not exist")
  })

  it('rejects unknown pet.json fields (no silent extra data)', async () => {
    await expectRejected(async () => {
      const pet = await J('pet/pet.json')
      ;(pet as Record<string, unknown>).evil = true
      await W('pet/pet.json', JSON.stringify(pet))
    }, 'offending field: evil')
  })

  it("rejects the unimplemented insigniaMode 'overlay'", async () => {
    await expectRejected(async () => {
      const pet = await J('pet/pet.json') as unknown as { gradePolicy: { insigniaMode: string } }
      pet.gradePolicy.insigniaMode = 'overlay'
      await W('pet/pet.json', JSON.stringify(pet))
    }, "'overlay' is not implemented")
  })

  it('rejects out-of-range variantPose indices', async () => {
    await expectRejected(async () => {
      const pet = await J('pet/pet.json') as unknown as { poseSprite: { variantPose: Record<string, number> } }
      pet.poseSprite.variantPose.failed = 99
      await W('pet/pet.json', JSON.stringify(pet))
    }, 'out of range')
  })

  it('rejects non-ascending journey thresholds through the REAL engine validator', async () => {
    await expectRejected(async () => {
      const manifest = await J('journey/manifest.json') as unknown as { levels: { threshold: number }[] }
      manifest.levels[1]!.threshold = 999
      manifest.levels[2]!.threshold = 5
      await W('journey/manifest.json', JSON.stringify(manifest))
    }, 'strictly increasing')
  })

  it('accepts the pristine template (control)', async () => {
    const result = await runCase(async () => {})
    expect(result.ok, result.errors.join(' | ')).toBe(true)
  })
})
