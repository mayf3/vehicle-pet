/**
 * pnpm-lock.yaml structural extraction and dependency-drift classification
 * (Goal 发布 §9, RISK_3).
 *
 * The parser extracts only what the drift guard needs — importer dependency
 * (specifier, version) pairs and per-package blocks — instead of importing a
 * YAML runtime, so classification is deterministic and reviewable. pnpm
 * writes this file programmatically; any format the parser cannot
 * understand fails closed (`LOCKFILE_UNPARSEABLE`), never silently passes.
 * @module scripts/release/lib/lockfile
 */

import { deepEqual } from './util.mjs'

export const VEHICLE_PET_PACKAGE = '@mayf3/vehicle-pet'

/**
 * Extract drift-relevant structure from a pnpm-lock.yaml document.
 * @param {string} text raw lockfile bytes
 * @returns {{ok: true, summary: LockSummary} | {ok: false, reason: 'LOCKFILE_UNPARSEABLE', detail: string}}
 */
export function summarizeLockfile(text) {
  const lines = text.split('\n')
  if (!lines.some(line => line.startsWith('lockfileVersion:'))) {
    return { ok: false, reason: 'LOCKFILE_UNPARSEABLE', detail: 'no lockfileVersion key found' }
  }
  /** @type {Record<string, {specifier?: string, version?: string}>} */
  let importerDeps = {}
  try {
    importerDeps = parseImporterDeps(lines)
  } catch (error) {
    return { ok: false, reason: 'LOCKFILE_UNPARSEABLE', detail: String(error) }
  }
  const packageBlocks = extractBlocksAtIndent(lines, 'packages')
  const snapshotBlocks = extractBlocksAtIndent(lines, 'snapshots')
  /** @type {LockSummary} */
  return {
    ok: true,
    summary: {
      lockfileVersion: (lines.find(line => line.startsWith('lockfileVersion:')) ?? '').trim(),
      importerDeps,
      packageBlocks,
      snapshotBlocks,
    },
  }
}

/**
 * @typedef {{lockfileVersion: string, importerDeps: Record<string, {specifier?: string, version?: string}>, packageBlocks: Record<string, string[]>, snapshotBlocks: Record<string, string[]>}} LockSummary
 */

/**
 * Parse the `importers:` section dependency map: importer path → dep kind →
 * package name → {specifier, version}.
 * @param {string[]} lines
 * @returns {Record<string, {specifier?: string, version?: string}>}
 */
function parseImporterDeps(lines) {
  const start = lines.findIndex(line => /^importers:\s*$/.test(line))
  /** @type {Record<string, {specifier?: string, version?: string}>} */
  const deps = {}
  if (start === -1) return deps
  let index = start + 1
  while (index < lines.length && /^\s*$/.test(lines[index] ?? '')) index += 1
  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (line.trim() === '') break
    const indent = line.length - line.trimStart().length
    if (indent === 0) break // next top-level section
    // package name lines live at indent 6 inside `importers: → .: → deps:`
    const nameMatch = /^ {6}(?:'([^']+)'|(.+?)):\s*$/.exec(line)
    if (nameMatch === null) continue
    const name = nameMatch[1] ?? nameMatch[2] ?? ''
    /** @type {{specifier?: string, version?: string}} */
    const fields = {}
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const fieldLine = lines[cursor] ?? ''
      const fieldIndent = fieldLine.length - fieldLine.trimStart().length
      if (fieldLine.trim() === '' || fieldIndent <= 6) break
      const field = /^ {8}(specifier|version):\s*(.*)$/.exec(fieldLine)
      if (field !== null) {
        const key = /** @type {'specifier'|'version'} */ (field[1])
        fields[key] = unquoteYamlScalar(field[2] ?? '')
      }
      index = cursor
    }
    deps[name] = fields
  }
  return deps
}

/** @param {string} value */
function unquoteYamlScalar(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replaceAll("''", "'")
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replaceAll('\\"', '"')
  }
  return trimmed
}

/**
 * Capture every entry block of a top-level map section (`packages:` /
 * `snapshots:`) as raw line arrays keyed by entry name, so byte-level block
 * comparison catches any resolution change without modeling pnpm's schema.
 * @param {string[]} lines
 * @param {'packages'|'snapshots'} section
 * @returns {Record<string, string[]>}
 */
function extractBlocksAtIndent(lines, section) {
  const header = lines.findIndex(line => new RegExp(`^${section}:\\s*$`).test(line))
  /** @type {Record<string, string[]>} */
  const blocks = {}
  if (header === -1) return blocks
  let index = header + 1
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (line.trim() === '') { index += 1; continue }
    if (line.length - line.trimStart().length === 0) break // next section
    // Unquoted YAML keys may contain ':' inside URLs (tarball keys) as long
    // as the line ends with the block-key colon; greedy capture + anchored
    // colon handles that. Quoted keys are matched verbatim.
    const keyMatch = /^ {2}(?:'([^']+)'|(.+)):\s*$/.exec(line)
    if (keyMatch === null) { index += 1; continue }
    const key = keyMatch[1] ?? keyMatch[2] ?? ''
    const block = [line]
    let cursor = index + 1
    while (cursor < lines.length) {
      const inner = lines[cursor] ?? ''
      if (inner.trim() === '') { block.push(inner); cursor += 1; continue }
      if (inner.length - inner.trimStart().length <= 2) break
      block.push(inner)
      cursor += 1
    }
    while (block.length > 0 && block.at(-1)?.trim() === '') block.pop()
    blocks[key] = block
    index = cursor
  }
  return blocks
}

/**
 * Classify the dependency delta between two lockfile summaries.
 *
 * Allowed delta: the `@mayf3/vehicle-pet` entries move from `fromRef` to
 * `toRef`. Anything else that differs — unrelated package resolutions,
 * added or removed packages, importer specifier/version changes — is
 * `UNRELATED_DEPENDENCY_DRIFT` and must stop an apply before restart.
 * @param {{pre: LockSummary, post: LockSummary, fromRef: string, toRef: string}} input
 * @returns {{ok: true, vehiclePetMoved: boolean} | {ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT'|'LOCKFILE_UNPARSEABLE'|'VEHICLE_PET_LOCK_ANOMALY', drift: string[], detail: string}}
 */
export function classifyLockDrift(input) {
  const { pre, post, fromRef, toRef } = input
  /** @type {string[]} */
  const drift = []

  for (const [name, fields] of Object.entries(post.importerDeps)) {
    if (name === VEHICLE_PET_PACKAGE) continue
    const before = pre.importerDeps[name]
    if (before === undefined) drift.push(`importers: new dependency ${name} → ${fields.version ?? fields.specifier ?? '?'}`)
    else if (!deepEqual(before, fields)) {
      drift.push(`importers: ${name}: ${JSON.stringify(before)} → ${JSON.stringify(fields)}`)
    }
  }
  for (const name of Object.keys(pre.importerDeps)) {
    if (name !== VEHICLE_PET_PACKAGE && post.importerDeps[name] === undefined) {
      drift.push(`importers: dependency removed: ${name}`)
    }
  }

  collectBlockDrift('packages', pre.packageBlocks, post.packageBlocks, fromRef, toRef, drift)
  collectBlockDrift('snapshots', pre.snapshotBlocks, post.snapshotBlocks, fromRef, toRef, drift)

  if (drift.length > 0) {
    return {
      ok: false,
      reason: 'UNRELATED_DEPENDENCY_DRIFT',
      drift,
      detail: `${drift.length} unrelated lockfile entr${drift.length === 1 ? 'y' : 'ies'} changed`,
    }
  }
  const vehiclePetMoved = vehiclePetBlocksAtRef(pre.packageBlocks, post.packageBlocks, fromRef, toRef)
    && vehiclePetBlocksAtRef(pre.snapshotBlocks, post.snapshotBlocks, fromRef, toRef)
  return { ok: true, vehiclePetMoved }
}

/**
 * @param {'packages'|'snapshots'} section
 * @param {Record<string, string[]>} pre
 * @param {Record<string, string[]>} post
 * @param {string} fromRef
 * @param {string} toRef
 * @param {string[]} drift
 */
function collectBlockDrift(section, pre, post, fromRef, toRef, drift) {
  for (const [key, block] of Object.entries(post)) {
    const before = pre[key]
    if (before !== undefined && deepEqual(before, block)) continue
    if (isVehiclePetKey(key)) {
      // The vehicle-pet entry may move fromRef → toRef; any other shape is anomalous.
      const joinedBefore = before === undefined ? '' : before.join('\n')
      const joinedPost = block.join('\n')
      const shapeOk = joinedPost.includes(toRef)
        && (before === undefined ? true : joinedBefore.includes(fromRef))
      if (!shapeOk) {
        drift.push(`${section}: ${VEHICLE_PET_PACKAGE} entry changed unexpectedly (${describeRefDelta(joinedBefore, joinedPost, fromRef, toRef)})`)
      }
      continue
    }
    drift.push(`${section}: ${key} changed`)
  }
  for (const key of Object.keys(pre)) {
    if (post[key] === undefined && !isVehiclePetKey(key)) {
      drift.push(`${section}: ${key} removed`)
    }
  }
}

/** @param {string} key */
function isVehiclePetKey(key) {
  return key.startsWith(`${VEHICLE_PET_PACKAGE}@`)
}

/**
 * Informational: the vehicle-pet block set moved cleanly from fromRef to
 * toRef (same block count, post keys reference toRef, pre keys reference
 * fromRef). The hard gate is collectBlockDrift; this only reports movement.
 * @param {Record<string, string[]>} preBlocks
 * @param {Record<string, string[]>} postBlocks
 * @param {string} fromRef
 * @param {string} toRef
 */
function vehiclePetBlocksAtRef(preBlocks, postBlocks, fromRef, toRef) {
  const preKeys = Object.keys(preBlocks).filter(isVehiclePetKey)
  const postKeys = Object.keys(postBlocks).filter(isVehiclePetKey)
  if (preKeys.length !== postKeys.length || postKeys.length === 0) return false
  return postKeys.every(key => key.includes(toRef)) && preKeys.every(key => key.includes(fromRef))
}

/** @param {string} before @param {string} after @param {string} fromRef @param {string} toRef */
function describeRefDelta(before, after, fromRef, toRef) {
  const parts = []
  if (!after.includes(toRef)) parts.push(`post does not reference ${toRef}`)
  if (before !== '' && !before.includes(fromRef)) parts.push(`pre did not reference ${fromRef}`)
  return parts.length > 0 ? parts.join('; ') : 'shape anomaly'
}

/**
 * Pre-install consistency gate: every non-vehicle-pet importer dependency
 * must already agree between profile package.json and the preimage lock, so
 * `pnpm install` cannot silently re-resolve unrelated floating deps
 * (RISK_3). vehicle-pet is excluded — the pin step owns its transition.
 * @param {{packageDeps: Record<string, string>, lock: LockSummary}} input
 * @returns {{ok: true} | {ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT', phase: 'PRE_INSTALL', drift: string[]}}
 */
export function preInstallConsistency(input) {
  const { packageDeps, lock } = input
  /** @type {string[]} */
  const drift = []
  for (const [name, spec] of Object.entries(packageDeps)) {
    if (name === VEHICLE_PET_PACKAGE) continue
    const locked = lock.importerDeps[name]
    if (locked === undefined) {
      drift.push(`${name}: in package.json (${JSON.stringify(spec)}) but absent from lockfile`)
      continue
    }
    if (locked.specifier !== spec) {
      drift.push(`${name}: package.json spec ${JSON.stringify(spec)} != lockfile specifier ${JSON.stringify(locked.specifier)} — install would re-resolve it`)
    }
  }
  if (drift.length > 0) {
    return { ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT', phase: 'PRE_INSTALL', drift }
  }
  return { ok: true }
}
