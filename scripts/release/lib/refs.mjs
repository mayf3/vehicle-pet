/**
 * Git truth for the Vehicle Pet release tool (Goal 发布 §7).
 *
 * The target ref must be an exact 40-hex commit that is verifiably present
 * in the origin object graph of the Vehicle Pet repository. The tool never
 * requires `local main == origin/main`, never resets/stashes/checks out or
 * pulls any existing checkout, and reads repository bytes only through
 * object access (`git archive`) or a fresh detached worktree it creates and
 * removes itself.
 * @module scripts/release/lib/refs
 */

import { open, mkdtemp, rm, readdir, stat, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { run, runOk, sha256Hex } from './util.mjs'

const extractTar = promisify(execFile)

export const EXACT_REF_PATTERN = /^[0-9a-f]{40}$/

/**
 * Validate the CLI target as an exact 40-hex commit SHA. `main`, `latest`,
 * branch names, short SHAs, and tags are rejected before anything else runs.
 * @param {string|undefined} input
 * @returns {{ok: true, ref: string} | {ok: false, reason: string, detail: string}}
 */
export function validateExactRef(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    return { ok: false, reason: 'TARGET_REF_MISSING', detail: 'a TARGET_REF argument is required' }
  }
  const candidate = input.trim().toLowerCase()
  if (!EXACT_REF_PATTERN.test(candidate)) {
    return {
      ok: false,
      reason: 'TARGET_REF_NOT_EXACT_40HEX',
      detail: `received ${JSON.stringify(input)}; only an exact 40-hex commit SHA is accepted `
        + '(main / latest / branch / short SHA / tag are rejected by design)',
    }
  }
  return { ok: true, ref: candidate }
}

/**
 * Prove the ref exists in the origin object graph, without assuming anything
 * about any local branch. Preferred proof is a fetch of the exact SHA from
 * origin; the fallback is a full origin fetch followed by local object
 * presence (all objects then came from origin's graph).
 * @param {{repo: string, ref: string, timeoutMs?: number}} options
 * @returns {Promise<{ok: true, method: 'FETCH_BY_SHA'|'LOCAL_OBJECT_POST_FETCH', originUrl: string}
 *   | {ok: false, reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN', detail: string}>}
 */
export async function verifyRefFromOrigin(options) {
  const { repo, ref, timeoutMs = 120_000 } = options
  const originUrl = (await run('git', ['-C', repo, 'remote', 'get-url', 'origin'], { timeoutMs })).stdout.trim()
    || '(no origin remote)'
  const bySha = await run('git', ['-C', repo, 'fetch', '--quiet', 'origin', ref], { timeoutMs })
  if (bySha.code === 0) {
    return { ok: true, method: 'FETCH_BY_SHA', originUrl }
  }
  const full = await run('git', ['-C', repo, 'fetch', '--quiet', 'origin'], { timeoutMs })
  if (full.code !== 0) {
    return {
      ok: false,
      reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN',
      detail: `git fetch origin failed: ${full.stderr.trim() || full.stdout.trim()}`,
    }
  }
  const object = await run('git', ['-C', repo, 'cat-file', '-e', `${ref}^{commit}`], { timeoutMs })
  if (object.code !== 0) {
    return {
      ok: false,
      reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN',
      detail: `fetch-by-SHA was rejected by origin and the object is absent after a full fetch `
        + `(${bySha.stderr.trim() || bySha.stdout.trim() || 'no origin detail'})`,
    }
  }
  return { ok: true, method: 'LOCAL_OBJECT_POST_FETCH', originUrl }
}

/**
 * Extract the exact ref's tree through `git archive` (pure object access; no
 * worktree, no checkout of anything existing). Returns the directory plus
 * per-file sha256 map of every tracked file.
 * @param {{repo: string, ref: string, timeoutMs?: number}} options
 * @returns {Promise<{dir: string, files: Record<string, string>}>}
 */
export async function extractRefTree(options) {
  const { repo, ref, timeoutMs = 120_000 } = options
  const dir = await mkdtemp(join(tmpdir(), 'vehicle-pet-release-tree-'))
  const tarPath = join(dir, 'archive.tar')
  // git archive streams the tar to stdout; bind stdout to a file descriptor
  // instead of a shell redirection so no command ever runs under a shell.
  const handle = await open(tarPath, 'w')
  try {
    const result = await new Promise((resolve) => {
      const child = spawn('git', ['-C', repo, 'archive', '--format=tar', ref], {
        stdio: ['ignore', handle.fd, 'pipe'],
      })
      let stderr = ''
      child.stderr?.on('data', chunk => { stderr += chunk })
      child.on('error', error => resolve({ code: null, stderr: `${stderr}\n${String(error)}` }))
      child.on('close', code => resolve({ code, stderr }))
    })
    if (result.code !== 0) {
      throw new Error(`git archive ${ref} failed: ${result.stderr.trim()}`)
    }
  } finally {
    await handle.close()
  }
  const out = join(dir, 'tree')
  await runOk('mkdir', ['-p', out], { what: 'mkdir extraction dir', timeoutMs })
  await extractTar('tar', ['-xf', tarPath, '-C', out], { timeout: timeoutMs })
  await rm(tarPath, { force: true })
  const files = await hashTree(out)
  return { dir: join(out), files }
}

/**
 * Hash every regular file under `root` (relative posix paths → sha256).
 * Symlinks and special files are ignored (the installed package tree is
 * regular files only).
 * @param {string} root
 * @returns {Promise<Record<string, string>>}
 */
export async function hashTree(root) {
  /** @type {Record<string, string>} */
  const files = {}
  await walk(root, '')
  return files

  /**
   * @param {string} absolute
   * @param {string} relative
   */
  async function walk(absolute, relative) {
    const entries = await readdir(absolute, { withFileTypes: true })
    for (const entry of entries) {
      const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`
      const childAbsolute = join(absolute, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        await walk(childAbsolute, childRelative)
        continue
      }
      if (!entry.isFile()) continue
      const info = await stat(childAbsolute)
      if (!info.isFile()) continue
      files[childRelative] = sha256Hex(await readFile(childAbsolute))
    }
  }
}

/**
 * Compare two file-hash maps. Returns the symmetric difference detail.
 * @param {Record<string, string>} expected
 * @param {Record<string, string>} actual
 */
export function diffTrees(expected, actual) {
  const expectedKeys = new Set(Object.keys(expected))
  const actualKeys = new Set(Object.keys(actual))
  /** @type {{path: string, kind: 'MISSING_IN_INSTALLED'|'UNEXPECTED_IN_INSTALLED'|'CONTENT_MISMATCH'}[]} */
  const differences = []
  for (const path of expectedKeys) {
    if (!actualKeys.has(path)) differences.push({ path, kind: 'MISSING_IN_INSTALLED' })
    else if (expected[path] !== actual[path]) differences.push({ path, kind: 'CONTENT_MISMATCH' })
  }
  for (const path of actualKeys) {
    if (!expectedKeys.has(path)) differences.push({ path, kind: 'UNEXPECTED_IN_INSTALLED' })
  }
  differences.sort((a, b) => (a.path < b.path ? -1 : 1))
  return differences
}
