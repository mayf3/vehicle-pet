/**
 * Re-audit regression tests (BLOCKER_UNION R1): the git-truth local-object
 * shortcut (B1), the state-probe origin anchoring (B2), and the multi-word
 * ps-env parsing (ops F1).
 */
import { describe, expect, it } from 'vitest'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyRefFromOrigin } from '../../scripts/release/lib/refs.mjs'
import { comparePetState } from '../../scripts/release/lib/stateprobe.mjs'
import { parsePsEnv } from '../../scripts/release/lib/service.mjs'
import { createStaleCloneFixture, createFixtureProfile, readText } from './helpers'
import { runPlan } from '../../scripts/release/lib/flow.mjs'
import { run } from '../../scripts/release/lib/util.mjs'

describe('B1: git truth must not trust locally-created objects', () => {
  it('rejects a 40-hex commit that exists only locally (never pushed)', async () => {
    const fixture = await createStaleCloneFixture({ name: 'localonly' })
    // Create a commit in the clone that is NEVER pushed to its origin.
    await writeFile(join(fixture.clone, 'local-only.txt'), 'local object\n', 'utf8')
    await run('git', ['-C', fixture.clone, 'add', 'local-only.txt'], { timeoutMs: 30_000 })
    await run('git', ['-C', fixture.clone, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'local-only'], { timeoutMs: 30_000 })
    const localRef = (await run('git', ['-C', fixture.clone, 'rev-parse', 'HEAD'], { timeoutMs: 30_000 })).stdout.trim()
    expect(localRef).not.toBe(fixture.refA)

    const direct = await verifyRefFromOrigin({ repo: fixture.clone, ref: localRef })
    expect(direct).toMatchObject({ ok: false, reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN' })
  })

  it('still proves a pushed ref via the empty bare probe', async () => {
    const fixture = await createStaleCloneFixture({ name: 'pushed-ok' })
    const proof = await verifyRefFromOrigin({ repo: fixture.clone, ref: fixture.refB })
    expect(proof).toMatchObject({ ok: true })
    if (!proof.ok) return
    expect(['REMOTE_BARE_FETCH_BY_SHA', 'REMOTE_BARE_FULL_FETCH']).toContain(proof.method)
  })

  it('runPlan rejects a local-only target before any mutation', async () => {
    const fixture = await createStaleCloneFixture({ name: 'localonly-plan' })
    await writeFile(join(fixture.clone, 'local-only.txt'), 'local object\n', 'utf8')
    await run('git', ['-C', fixture.clone, 'add', 'local-only.txt'], { timeoutMs: 30_000 })
    await run('git', ['-C', fixture.clone, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'local-only'], { timeoutMs: 30_000 })
    const localRef = (await run('git', ['-C', fixture.clone, 'rev-parse', 'HEAD'], { timeoutMs: 30_000 })).stdout.trim()
    const home = join(fixture.root, 'dsh-home')
    await createFixtureProfile({ home, spec: `git+file://${fixture.origin}#${fixture.refA}` })
    const outRoot = join(fixture.root, 'receipts')
    const result = await runPlan({
      targetInput: localRef,
      options: {
        repo: fixture.clone,
        dshHomeOverride: home,
        profile: 'web',
        portHint: undefined,
        cdpUrl: 'http://127.0.0.1:1',
        originPatterns: [],
        outRoot,
        allowMissingStateProbe: false,
        skipStateProbe: true,
        json: false,
      },
    })
    expect(result.exitCode).toBe(2)
    const { readdir } = await import('node:fs/promises')
    const dirs = (await readdir(outRoot, { withFileTypes: true })).filter(entry => entry.isDirectory())
    const receipt = JSON.parse(await readText(join(outRoot, dirs[0]!.name, 'receipt.json')))
    expect(receipt.result).toBe('TARGET_REF_UNREACHABLE_FROM_ORIGIN')
  })
})

describe('B2: state compare only trusts the web origin', () => {
  const prefs = JSON.stringify({ schemaVersion: 1, position: { xRatio: 0.5, yRatio: 0.5 }, reducedMotion: 'off' })
    function capture(origin: string, withValues: boolean) {
    return {
      status: 'CAPTURED',
      targets: [{
        url: `${origin}/`,
        storage: {
          origin,
          values: withValues
            ? {
                'vehicle-pet/overlay-preferences/v1': prefs,
                'vehicle-pet/usage-ledger/v1': JSON.stringify({ schemaVersion: 1, cumulativePoints: 5, revision: 2, byDay: {}, lastSeen: { a: 1 } }),
                'deepseek-pet:scale': '1.2',
              }
            : {
                'vehicle-pet/overlay-preferences/v1': null,
                'vehicle-pet/usage-ledger/v1': null,
                'deepseek-pet:scale': null,
              },
        },
      }],
    }
  }

  it('does NOT compare an unrelated localhost tab as a PASS (empty pet storage null==null)', () => {
    const verdicts = comparePetState({
      pre: capture('http://127.0.0.1:5173', false),
      post: capture('http://127.0.0.1:5173', false),
      expectedOrigins: ['http://127.0.0.1:3080', 'http://localhost:3080'],
    })
    expect(verdicts.STATE_PROBE?.verdict).toBe('UNAVAILABLE')
    expect(verdicts.POSITION_PREFERENCE_PRESERVED).toBeUndefined()
  })

  it('passes when the capture origin matches the expected web origin', () => {
    const verdicts = comparePetState({
      pre: capture('http://127.0.0.1:3080', true),
      post: capture('http://127.0.0.1:3080', true),
      expectedOrigins: ['http://127.0.0.1:3080', 'http://localhost:3080'],
    })
    expect(verdicts.POSITION_PREFERENCE_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.USAGE_LEDGER_PRESERVED?.verdict).toBe('PASS')
  })
})

describe('ops F1: parsePsEnv keeps multi-word values', () => {
  it('slices each allowlisted value to the next marker, not to the first space', () => {
    const line = 'node bin.ts web SSH_CONNECTION=100.83.67.35 100.64.0.1 51999 100.64.0.9 22 HOME=/Users/x'
    const env = parsePsEnv(line, ['SSH_CONNECTION', 'HOME'])
    expect(env.SSH_CONNECTION).toBe('100.83.67.35 100.64.0.1 51999 100.64.0.9 22')
    expect(env.HOME).toBe('/Users/x')
  })

  it('handles a value running to end of output and strips trailing newline', () => {
    const env = parsePsEnv('pnpm dsh web DSH_HOME=/tmp/some home dir\n', ['DSH_HOME'])
    expect(env.DSH_HOME).toBe('/tmp/some home dir')
  })
})
