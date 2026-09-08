/**
 * Evidence persistence (Goal 发布 §15): production evidence is committed
 * from a docs-only branch cut from the exact current origin/main — never
 * from a possibly stale local main (the be653ba incident). The tool fetches
 * origin fresh, cuts a detached worktree at origin/main, copies the given
 * evidence files under docs/evidence/, verifies the committed diff touches
 * ONLY docs/evidence/**, and leaves the push/merge decision to the Operator.
 * @module scripts/release/lib/evidence
 */

import { mkdir, readdir, copyFile, stat, rm } from 'node:fs/promises'
import { join, basename, extname, isAbsolute, sep } from 'node:path'
import { run, runOk, timestampTag } from './util.mjs'

const ALLOWED_EXTENSIONS = new Set(['.md', '.png', '.jpg', '.jpeg', '.json', '.txt', '.sha256', '.log'])
const MAX_FILE_BYTES = 25_000_000

/**
 * Create the docs-only evidence branch.
 * @param {{sources: string[], dest: string, message: string, repo: string, timeoutMs?: number}} input
 * @returns {Promise<{ok: true, branch: string, head: string, base: string, worktree: string, files: string[]} | {ok: false, reason: string, detail: string}>}
 */
export async function createEvidenceBranch(input) {
  const { sources, dest, message, repo, timeoutMs = 120_000 } = input
  if (!dest.startsWith('docs/evidence/')) {
    return { ok: false, reason: 'EVIDENCE_DEST_INVALID', detail: `destination must start with docs/evidence/ (got ${dest})` }
  }
  if (sources.length === 0) {
    return { ok: false, reason: 'EVIDENCE_SOURCES_EMPTY', detail: 'at least one --src file or directory is required' }
  }
  for (const source of sources) {
    if (!isAbsolute(source)) {
      return { ok: false, reason: 'EVIDENCE_SOURCE_PATH', detail: `--src must be absolute (got ${source})` }
    }
    const info = await stat(source).catch(() => undefined)
    if (info === undefined) {
      return { ok: false, reason: 'EVIDENCE_SOURCE_MISSING', detail: `${source} does not exist` }
    }
  }

  // 1. fresh remote truth — this is the whole point of the command.
  const fetch = await run('git', ['-C', repo, 'fetch', '--quiet', 'origin'], { timeoutMs })
  if (fetch.code !== 0) {
    return { ok: false, reason: 'REMOTE_MAIN_FETCH_FAILED', detail: fetch.stderr.trim() || fetch.stdout.trim() }
  }
  const base = (await runOk('git', ['-C', repo, 'rev-parse', 'origin/main'], { what: 'resolve origin/main', timeoutMs })).stdout.trim()

  // 2. fresh detached worktree at origin/main + docs-only branch.
  const worktree = `${repo}-evidence-wt-${timestampTag()}`
  const branch = `evidence/release-${timestampTag()}`
  const add = await run('git', ['-C', repo, 'worktree', 'add', '--detach', worktree, base], { timeoutMs })
  if (add.code !== 0) {
    return { ok: false, reason: 'EVIDENCE_WORKTREE_FAILED', detail: add.stderr.trim() }
  }
  const switchResult = await run('git', ['-C', worktree, 'switch', '-c', branch], { timeoutMs })
  if (switchResult.code !== 0) {
    await run('git', ['-C', repo, 'worktree', 'remove', '--force', worktree], { timeoutMs })
    return { ok: false, reason: 'EVIDENCE_BRANCH_FAILED', detail: switchResult.stderr.trim() }
  }

  // 3. copy allowed files under docs/evidence/<dest-tail>.
  /** @type {string[]} */
  const copied = []
  try {
    const targetDir = join(worktree, dest)
    await mkdir(targetDir, { recursive: true })
    for (const source of sources) {
      const info = await stat(source)
      if (info.isDirectory()) {
        const targetSub = join(targetDir, basename(source))
        await mkdir(targetSub, { recursive: true })
        for (const entry of await readdir(source, { withFileTypes: true })) {
          if (!entry.isFile()) continue
          await copyAllowed(source, entry.name, targetSub, copied)
        }
      } else {
        await copyAllowed(join(source, '..'), basename(source), targetDir, copied)
      }
    }
    if (copied.length === 0) {
      throw new Error('no allowed files found in the given sources')
    }
    await runOk('git', ['-C', worktree, 'add', dest], { what: 'git add evidence', timeoutMs })
    const status = await runOk('git', ['-C', worktree, 'status', '--porcelain'], { what: 'git status', timeoutMs })
    const touchingOutside = status.stdout.split('\n')
      .map(line => line.slice(3).trim())
      .filter(path => path !== '' && !path.startsWith(`docs${sep}evidence`) && !path.startsWith('docs/evidence'))
    if (touchingOutside.length > 0) {
      throw new Error(`staged changes outside docs/evidence: ${touchingOutside.join(', ')}`)
    }
    const commit = await run('git', ['-C', worktree, 'commit', '--quiet', '-m', message], { timeoutMs })
    if (commit.code !== 0) {
      throw new Error(`git commit failed: ${commit.stderr.trim()}`)
    }
    const head = (await runOk('git', ['-C', worktree, 'rev-parse', 'HEAD'], { what: 'resolve evidence head', timeoutMs })).stdout.trim()
    return { ok: true, branch, head, base, worktree, files: copied }
  } catch (error) {
    // Roll the failed attempt back completely (worktree and branch) so the
    // shared repo is left clean; the error detail above explains why.
    await run('git', ['-C', repo, 'worktree', 'remove', '--force', worktree], { timeoutMs }).catch(() => {})
    await run('git', ['-C', repo, 'branch', '-D', branch], { timeoutMs }).catch(() => {})
    return { ok: false, reason: 'EVIDENCE_COMMIT_FAILED', detail: String(error) }
  }
}

/**
 * @param {string} sourceDir
 * @param {string} name
 * @param {string} targetDir
 * @param {string[]} copied
 */
async function copyAllowed(sourceDir, name, targetDir, copied) {
  if (!ALLOWED_EXTENSIONS.has(extname(name).toLowerCase())) return
  const from = join(sourceDir, name)
  const info = await stat(from)
  if (info.size > MAX_FILE_BYTES) {
    throw new Error(`${from} exceeds the ${MAX_FILE_BYTES} byte evidence file cap`)
  }
  await copyFile(from, join(targetDir, name))
  copied.push(name)
}

/** Remove the evidence worktree after the Operator has pushed (housekeeping). */
export async function removeEvidenceWorktree(input) {
  const { repo, worktree } = input
  await rm(worktree, { recursive: true, force: true })
  await run('git', ['-C', repo, 'worktree', 'prune'], { timeoutMs: 30_000 })
}
