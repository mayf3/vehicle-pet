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
 * about any local branch — and without the local-object shortcut: `git
 * fetch origin <sha>` exits 0 WITHOUT transferring anything when the object
 * already exists locally, so probing the working repository can never
 * distinguish "origin has it" from "I had it". The proof therefore runs in
 * a throwaway EMPTY bare repository (no local objects at all): fetch the
 * exact SHA from the origin URL into it — success means origin itself
 * provided the object. When origin rejects fetch-by-SHA (some servers do),
 * fall back to a full fetch into the same empty bare and check object
 * presence there; every object in that bare came from origin.
 *
 * After a successful proof, the ref is fetched into the working repository
 * ONLY if absent there, so `git archive` can read it (the object's origin
 * provenance is already established).
 * @param {{repo: string, ref: string, timeoutMs?: number}} options
 * @returns {Promise<{ok: true, method: 'REMOTE_BARE_FETCH_BY_SHA'|'REMOTE_BARE_FULL_FETCH', originUrl: string}
 *   | {ok: false, reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN', detail: string}>}
 */
export async function verifyRefFromOrigin(options) {
  const { repo, ref, timeoutMs = 300_000 } = options
  const originUrl = (await run('git', ['-C', repo, 'remote', 'get-url', 'origin'], { timeoutMs })).stdout.trim()
    || '(no origin remote)'
  const probe = await mkdtemp(join(tmpdir(), 'vehicle-pet-release-refcheck-'))
  try {
    const init = await run('git', ['init', '-q', '--bare', probe], { timeoutMs })
    if (init.code !== 0) {
      return { ok: false, reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN', detail: `cannot create the empty verification repository: ${init.stderr.trim()}` }
    }
    const bySha = await run('git', ['-C', probe, 'fetch', '--quiet', originUrl, ref], { timeoutMs })
    if (bySha.code === 0) {
      await ensureObjectFetchedLocally({ repo, ref, originUrl, timeoutMs })
      return { ok: true, method: 'REMOTE_BARE_FETCH_BY_SHA', originUrl }
    }
    const full = await run('git', ['-C', probe, 'fetch', '--quiet', originUrl], { timeoutMs })
    if (full.code !== 0) {
      return {
        ok: false,
        reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN',
        detail: `origin ${originUrl} is unreachable: ${(full.stderr || bySha.stderr).trim() || 'no detail'}`,
      }
    }
    const object = await run('git', ['-C', probe, 'cat-file', '-e', `${ref}^{commit}`], { timeoutMs })
    if (object.code !== 0) {
      return {
        ok: false,
        reason: 'TARGET_REF_UNREACHABLE_FROM_ORIGIN',
        detail: `origin ${originUrl} does not provide ${ref} (fetch-by-SHA was rejected and a full fetch into an empty repository does not contain the object)`
          + ` [bySha: ${bySha.stderr.trim() || bySha.stdout.trim() || 'no detail'}]`,
      }
    }
    await ensureObjectFetchedLocally({ repo, ref, originUrl, timeoutMs })
    return { ok: true, method: 'REMOTE_BARE_FULL_FETCH', originUrl }
  } finally {
    await rm(probe, { recursive: true, force: true })
  }
}

/**
 * Make the proven object readable in the working repository for later
 * `git archive`. The object's origin provenance is already established; a
 * missing local object is fetched from origin (a plain transfer), an
 * existing local one needs nothing (its bytes are hash-verified by git
 * against the same SHA).
 * @param {{repo: string, ref: string, originUrl: string, timeoutMs: number}} input
 */
async function ensureObjectFetchedLocally(input) {
  const { repo, ref, originUrl, timeoutMs } = input
  const present = await run('git', ['-C', repo, 'cat-file', '-e', `${ref}^{commit}`], { timeoutMs })
  if (present.code === 0) return
  await run('git', ['-C', repo, 'fetch', '--quiet', originUrl, ref], { timeoutMs })
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
