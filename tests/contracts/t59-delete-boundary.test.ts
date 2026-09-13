/**
 * T59 regression — VP-DISPOSABLE-HOME-DELETE-BOUNDARY-01.
 *
 * Spawns the REAL scripts/check-dsh-lifecycle.mjs with a module-resolution
 * hook that intercepts node:fs/promises rm (records the call, NEVER deletes —
 * REAL_RM = 0) and asserts the disposable-only guard decides on the
 * canonical/resolved filesystem target:
 *   dedicated real /tmp child        -> allowed (guard passes)
 *   /tmp root                        -> rejected
 *   /tmp/../outside                  -> rejected
 *   /tmp/../home/...                 -> rejected
 *   symlink component escaping /tmp  -> rejected
 */
import { spawnSync } from 'node:child_process'
import { describe, expect, it, afterAll } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const script = path.join(repoRoot, 'scripts', 'check-dsh-lifecycle.mjs')

const hookDir = mkdtempSync(path.join(tmpdir(), 't59-hook-'))
const shimUrl = 'file://' + path.join(hookDir, 'fsp-shim.mjs')
writeFileSync(path.join(hookDir, 'fsp-shim.mjs'), `
import * as real from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';
const LOG = process.env.T59_LOG;
export const rm = async function rm(p, opts) {
  const raw = String(p);
  fs.appendFileSync(LOG, JSON.stringify({ rawInput: raw, resolved: path.resolve(raw), rmCalled: true }) + '\\n');
};
export const readFile = real.readFile;
export default real;
`)
writeFileSync(path.join(hookDir, 'preload.mjs'), `
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'node:fs/promises' &&
        !String(context.parentURL || '').endsWith('/fsp-shim.mjs')) {
      return nextResolve(${JSON.stringify(shimUrl)}, { ...context, parentURL: undefined });
    }
    return nextResolve(specifier, context);
  },
});
`)

// Sandbox lives under the literal /tmp namespace (the disposable zone).
const root = path.join(realpathSync('/tmp'), `t59-sandbox-${process.pid}`)
mkdirSync(path.join(root, 'dedicated'), { recursive: true })
const outside = mkdtempSync(path.join(tmpdir(), 't59-outside-')) // NOT under /tmp
symlinkSync(outside, path.join(root, 'escape-link'))
mkdirSync(path.join(root, 'real-nest'), { recursive: true })
symlinkSync(path.join(root, 'real-nest'), path.join(root, 'nest'))

function runCase(home) {
  const log = path.join(hookDir, `case-${Math.random().toString(36).slice(2)}.log`)
  const stub = mkdtempSync(path.join(tmpdir(), 't59-stub-'))
  const r = spawnSync(process.execPath,
    ['--import', path.join(hookDir, 'preload.mjs'), script],
    { cwd: repoRoot, encoding: 'utf8',
      env: { ...process.env, DISPOSABLE_DSH_LIFECYCLE_HOME: home, DSH_REFERENCE_WORKTREE: stub, T59_LOG: log } })
  const rmLines = []
  if (existsSync(log)) {
    for (const line of r.status === null ? [] : readNonEmpty(log)) rmLines.push(JSON.parse(line))
  }
  return { status: r.status, stderr: r.stderr || '', rmLines }
}

function readNonEmpty(file) {
  return readFileSync(file, 'utf8').split('\n').filter(Boolean)
}

describe('T59 disposable-home delete boundary', () => {
  afterAll(() => {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
    rmSync(hookDir, { recursive: true, force: true })
  })

  it('allows a dedicated real /tmp child and records exactly one intercepted rm (REAL_RM=0)', () => {
    const dedicated = path.join(root, 'dedicated')
    const { stderr, rmLines } = runCase(dedicated)
    expect(stderr).not.toContain('refusing')
    expect(rmLines).toHaveLength(1)
    expect(rmLines[0].resolved).toBe(dedicated)
    // the interceptor never deletes
    expect(existsSync(dedicated)).toBe(true)
  })

  it('rejects the /tmp root', () => {
    const { stderr, rmLines } = runCase('/tmp/')
    expect(stderr).toContain('refusing')
    expect(rmLines).toHaveLength(0)
  })

  it('rejects /tmp/../outside', () => {
    const { stderr, rmLines } = runCase('/tmp/../t59-OUTSIDE-ESCAPE')
    expect(stderr).toContain('refusing')
    expect(rmLines).toHaveLength(0)
  })

  it('rejects /tmp/../home/... (agent-home escape)', () => {
    const { stderr, rmLines } = runCase('/tmp/../home/example/.dsh')
    expect(stderr).toContain('refusing')
    expect(rmLines).toHaveLength(0)
  })

  it('rejects a symlink component escaping /tmp', () => {
    const { stderr, rmLines } = runCase(path.join(root, 'escape-link'))
    expect(stderr).toContain('refusing')
    expect(rmLines).toHaveLength(0)
  })

  it('rejects a nested symlink component', () => {
    const { stderr, rmLines } = runCase(path.join(root, 'nest'))
    expect(stderr).toContain('refusing')
    expect(rmLines).toHaveLength(0)
  })
})
