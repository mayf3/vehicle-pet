/**
 * README currentness + public docs presence (V8; Goal「开放」§10).
 * Bounded assertions — current facts and the absence of known-stale claims —
 * never a full-text snapshot. Doc links in README must exist on disk.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const readme = await readFile(path.join(REPO_ROOT, 'README.md'), 'utf8')

describe('README_CURRENTNESS_CHECK (bounded assertions)', () => {
  it('no longer carries known-stale claims', () => {
    for (const stale of [
      'Configurable Pet Engine V1\n',
      'V1 has no real Token integration',
      'independent overlay code/contract and experience audits have not yet run',
      'the Draft PR is not ready to merge',
      'compact panel',
      '112px + compact',
    ]) {
      expect(readme.includes(stale), `stale claim: ${JSON.stringify(stale)}`).toBe(false)
    }
  })

  it('states the current public-preview facts', () => {
    for (const current of [
      'Public Preview',
      'Creator Kit',
      'examples/minimal-pet',
      'PRIVACY_AND_DATA_BOUNDARY.md',
      'ASSET_AND_BRAND_POLICY.md',
      'SUPPORTED_ENVIRONMENTS.md',
      'GETTING_STARTED.md',
      'PET_DEFINITION_REFERENCE.md',
    ]) {
      expect(readme.includes(current), `missing current fact: ${current}`).toBe(true)
    }
  })

  it('links only to public docs that exist on disk', () => {
    const docLinks = [...readme.matchAll(/\((docs\/[^)]+\.md)\)/g)].map(match => match[1]!)
    expect(docLinks.length).toBeGreaterThanOrEqual(5)
    for (const link of docLinks) {
      expect(existsSync(path.join(REPO_ROOT, link)), link).toBe(true)
    }
  })
})

describe('PUBLIC_DOCS_PRESENCE_CHECK (Goal「开放」§10)', () => {
  it('ships the five required public/creator documents', () => {
    for (const doc of [
      'docs/creator/GETTING_STARTED.md',
      'docs/creator/PET_DEFINITION_REFERENCE.md',
      'docs/public/PRIVACY_AND_DATA_BOUNDARY.md',
      'docs/public/ASSET_AND_BRAND_POLICY.md',
      'docs/public/SUPPORTED_ENVIRONMENTS.md',
    ]) {
      expect(existsSync(path.join(REPO_ROOT, doc)), doc).toBe(true)
    }
  })

  it('records the landed split-license decision (Owner OPTION_B, 2026-09-11)', async () => {
    const policy = await readFile(path.join(REPO_ROOT, 'docs/public/ASSET_AND_BRAND_POLICY.md'), 'utf8')
    expect(policy).toContain('DECIDED (2026-09-11): Apache-2.0 (code) + CC BY 4.0 (assets)')
    expect(policy).toContain('not relicensed')
    expect(policy).toContain('not** a legal opinion')
    expect(existsSync(path.join(REPO_ROOT, 'LICENSE'))).toBe(true)
    expect(existsSync(path.join(REPO_ROOT, 'LICENSE.assets'))).toBe(true)
    expect(existsSync(path.join(REPO_ROOT, 'NOTICE'))).toBe(true)
    const pkg = JSON.parse(await readFile(path.join(REPO_ROOT, 'package.json'), 'utf8'))
    expect(pkg.license).toBe('Apache-2.0')
  })
})
