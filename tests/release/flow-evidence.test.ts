/**
 * Integration tests for the flow entry points on hermetic fixtures
 * (Goal 发布 §16-§17 logic, §15 evidence safety):
 *   - plan is read-only (NO_MUTATION_ON_DRY_RUN)
 *   - plan no-op detection (NO_OP_SAME_REF)
 *   - plan rejects refs that origin does not have
 *   - evidence branch is cut from fresh origin/main, never from the stale
 *     local checkout (STALE_LOCAL_MAIN_SAFE, EVIDENCE_BRANCH_FROM_REMOTE_MAIN)
 */
import { describe, expect, it } from 'vitest'
import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { runPlan } from '../../scripts/release/lib/flow.mjs'
import { createEvidenceBranch, removeEvidenceWorktree } from '../../scripts/release/lib/evidence.mjs'
import { createStaleCloneFixture, createFixtureProfile, readText } from './helpers'
import { run } from '../../scripts/release/lib/util.mjs'
function flowOptions(overrides: any) {
  return {
    repo: overrides.repo,
    dshHomeOverride: overrides.home,
    profile: 'web',
    portHint: undefined,
    cdpUrl: 'http://127.0.0.1:1',
    originPatterns: [],
    outRoot: overrides.outRoot,
    allowMissingStateProbe: false,
    skipStateProbe: true,
    json: false,
  } as any
}

describe('runPlan (read-only)', () => {
  it('NO_OP when the profile is already at the target ref', async () => {
    const fixture = await createStaleCloneFixture({ name: 'noop' })
    const home = join(fixture.root, 'dsh-home')
    // The fixture clone's history has REF_B (commit-b) — use fixture refs.
    await createFixtureProfile({ home, spec: `git+file://${fixture.origin}#${fixture.refB}` })
    const outRoot = join(fixture.root, 'receipts')
    const result = await runPlan({
      targetInput: fixture.refB,
      options: flowOptions({ repo: fixture.clone, home, outRoot }),
    })
    expect(result.exitCode).toBe(0)
    const dirs = await receiptDirsOf(outRoot)
    const receipt = JSON.parse(await readFile(join(outRoot, dirs[0]!, 'receipt.json'), 'utf8'))
    expect(receipt.result).toBe('NO_OP_ALREADY_AT_TARGET')
    expect(receipt.verdicts.ZERO_MUTATION.verdict).toBe('PASS')
    // zero mutation on the profile itself
    const packageJson = await readText(join(home, 'profiles', 'web', 'package.json'))
    expect(packageJson).toContain(fixture.refB)
  })

  it('reports a read-only UPGRADE plan and leaves the profile untouched', async () => {
    const fixture = await createStaleCloneFixture({ name: 'plan' })
    const home = join(fixture.root, 'dsh-home')
    await createFixtureProfile({ home, spec: `git+file://${fixture.origin}#${fixture.refA}` })
    const before = await readText(join(home, 'profiles', 'web', 'package.json'))
    const outRoot = join(fixture.root, 'receipts')
    const result = await runPlan({
      targetInput: fixture.refB,
      options: flowOptions({ repo: fixture.clone, home, outRoot }),
    })
    expect(result.exitCode).toBe(0)
    const after = await readText(join(home, 'profiles', 'web', 'package.json'))
    expect(after).toBe(before)
    const dirs = await receiptDirsOf(outRoot)
    const receipt = JSON.parse(await readFile(join(outRoot, dirs[0]!, 'receipt.json'), 'utf8'))
    expect(receipt.result).toBe('PLAN_READY')
    expect(receipt.gitTruth.method).toBe('REMOTE_BARE_FETCH_BY_SHA')
    expect(receipt.preimage.currentRef).toBe(fixture.refA)
  })

  it('rejects a target that origin cannot provide, before any mutation', async () => {
    const fixture = await createStaleCloneFixture({ name: 'reject' })
    const home = join(fixture.root, 'dsh-home')
    await createFixtureProfile({ home, spec: `git+file://${fixture.origin}#${fixture.refA}` })
    const outRoot = join(fixture.root, 'receipts')
    const missing = 'b'.repeat(40)
    const result = await runPlan({
      targetInput: missing,
      options: flowOptions({ repo: fixture.clone, home, outRoot }),
    })
    expect(result.exitCode).toBe(2)
    const dirs = await receiptDirsOf(outRoot)
    const receipt = JSON.parse(await readFile(join(outRoot, dirs[0]!, 'receipt.json'), 'utf8'))
    expect(receipt.result).toBe('TARGET_REF_UNREACHABLE_FROM_ORIGIN')
  })
})

/** Receipt directories only (skip the .gitignore housekeeping file). */
async function receiptDirsOf(outRoot: string): Promise<string[]> {
  const entries = await readdir(outRoot, { withFileTypes: true })
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
}

describe('createEvidenceBranch (stale-local-main safety)', () => {
  it('cuts the docs-only branch from fresh origin/main and never touches the local checkout', async () => {
    const fixture = await createStaleCloneFixture({ name: 'evidence' })
    // fixture.clone local main == refA (stale), origin/main == refB (fresh), WIP.txt present.
    const evidenceDir = join(fixture.root, 'evidence-src')
    await mkdir(evidenceDir, { recursive: true })
    await writeFile(join(evidenceDir, 'DRY_RUN.md'), '# dry run evidence\n', 'utf8')
    const result = await createEvidenceBranch({
      sources: [evidenceDir],
      dest: 'docs/evidence/release-test',
      message: 'test: evidence commit from fresh origin/main',
      repo: fixture.clone,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.base).toBe(fixture.refB) // NOT the stale local main refA
    expect(result.branch).toMatch(/^evidence\/release-/)
    // local checkout untouched: WIP still there, main still refA
    expect(await readText(join(fixture.clone, 'WIP.txt'))).toContain('work in progress')
    const localMain = (await run('git', ['-C', fixture.clone, 'rev-parse', 'main'], { timeoutMs: 30_000 })).stdout.trim()
    expect(localMain).toBe(fixture.refA)
    // the evidence commit itself contains only docs/evidence paths
    const committedPaths = (await run('git', ['-C', result.worktree, 'diff-tree', '--no-commit-id', '--name-only', '-r', result.head], { timeoutMs: 30_000 })).stdout.trim()
    expect(committedPaths.split('\n').every(path => path.startsWith('docs/evidence/'))).toBe(true)
    // housekeeping: the caller may remove the worktree
    await removeEvidenceWorktree({ repo: fixture.clone, worktree: result.worktree })
    await expect(stat(result.worktree)).rejects.toThrow()
  })

  it('refuses destinations outside docs/evidence', async () => {
    const fixture = await createStaleCloneFixture({ name: 'evidence-guard' })
    const bad = await createEvidenceBranch({
      sources: [fixture.clone],
      dest: 'src/evidence',
      message: 'nope',
      repo: fixture.clone,
    })
    expect(bad).toMatchObject({ ok: false, reason: 'EVIDENCE_DEST_INVALID' })
  })
})
