/**
 * Runtime identity proof (Goal 发布 §12): the applied state is proven at
 * three independent layers —
 *
 * 1. INSTALL: the profile lockfile resolution references the exact target
 *    ref (pnpm's install contract ties node_modules to the lockfile);
 * 2. CONTENT: the installed package tree is file-for-file identical to
 *    `git archive <target-ref>` of the Vehicle Pet repository (the codeload
 *    tarball pnpm installs is exactly the git tree, and `lib/` is tracked);
 * 3. SERVED: the bytes served at /plugins/@mayf3/vehicle-pet/client.js hash
 *    equal to the installed lib/client.js.
 *
 * A package.json edit alone never counts as success: if package ref ==
 * target but the served runtime does not match, APPLY = FAILED.
 * @module scripts/release/lib/proof
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { installedClientPath, SERVED_CLIENT_PATH } from './dshfacts.mjs'
import { extractRefTree, diffTrees, hashTree } from './refs.mjs'
import { run, sha256Hex } from './util.mjs'

/**
 * @typedef {object} ProofInput
 * @property {string} profileDir
 * @property {string} repo vehicle-pet git repository (object access only)
 * @property {string} ref expected exact ref
 * @property {string} lockRef ref extracted from the post-install lockfile
 * @property {number} port web port for the served-bytes fetch
 */

/**
 * Run the full runtime proof. Never mutates anything.
 * @param {ProofInput} input
 * @returns {Promise<{ok: boolean, install: ProofCheck, content: ProofCheck, served: ProofCheck, servedClientSha256?: string, installedClientSha256?: string}>}
 */
export async function runtimeProof(input) {
  const { profileDir, repo, ref, lockRef, port } = input
  const install = checkInstall(lockRef, ref)
  const content = await checkInstalledContent({ profileDir, repo, ref })
  const served = await checkServedClient({ profileDir, port })
  const ok = install.ok && content.ok && served.ok
  return {
    ok,
    install,
    content,
    served,
    servedClientSha256: served.servedSha256,
    installedClientSha256: served.installedSha256,
  }
}

/** @param {string|undefined} lockRef @param {string} ref @returns {ProofCheck} */
function checkInstall(lockRef, ref) {
  if (lockRef === undefined) {
    return { ok: false, layer: 'INSTALL', detail: `lockfile has no vehicle-pet git-fixed-ref; expected ${ref}` }
  }
  return lockRef === ref
    ? { ok: true, layer: 'INSTALL', detail: `lockfile resolution == ${ref}` }
    : { ok: false, layer: 'INSTALL', detail: `lockfile resolution ${lockRef} != target ${ref}` }
}

/**
 * Compare the installed package tree against the exact ref's git tree,
 * projected through the ref's package.json `files` whitelist (pnpm packs
 * git dependencies with npm pack semantics: the installed tree is the
 * files-field projection of the git tree). The projection rule set here is
 * deliberately tiny — plain paths and directories only — and fails closed
 * on wildcards, negations, or a missing files field, so an exotic future
 * package can only fail the proof, never silently pass it.
 * @param {{profileDir: string, repo: string, ref: string}} input
 * @returns {Promise<ProofCheck & {comparedFiles?: number}>}
 */
export async function checkInstalledContent(input) {
  const { profileDir, repo, ref } = input
  const installedDir = `${profileDir}/node_modules/@mayf3/vehicle-pet`
  let extracted
  try {
    extracted = await extractRefTree({ repo, ref })
  } catch (error) {
    return { ok: false, layer: 'CONTENT', detail: `git archive extraction failed: ${String(error)}` }
  }
  try {
    const manifest = JSON.parse(await readFile(join(extracted.dir, 'package.json'), 'utf8'))
    const projection = expectedPackageProjectionFromList(manifest.files, extracted.files)
    if (!projection.ok) {
      return { ok: false, layer: 'CONTENT', detail: `cannot derive expected package content from ref ${ref}: ${projection.detail}` }
    }
    const installedFiles = await hashTree(installedDir)
    const differences = diffTrees(projection.files, installedFiles)
    if (differences.length > 0) {
      const sample = differences.slice(0, 10).map(entry => `${entry.kind}:${entry.path}`).join(', ')
      return {
        ok: false,
        layer: 'CONTENT',
        detail: `${differences.length} file differences vs files-projection of git tree ${ref} (first: ${sample})`,
      }
    }
    return {
      ok: true,
      layer: 'CONTENT',
      detail: `installed tree == files-projection of git tree ${ref} (${Object.keys(projection.files).length} files compared)`,
      comparedFiles: Object.keys(projection.files).length,
    }
  } catch (error) {
    return { ok: false, layer: 'CONTENT', detail: `content projection failed: ${String(error)}` }
  } finally {
    const { rm } = await import('node:fs/promises')
    await rm(extracted.dir, { recursive: true, force: true })
  }
}

/**
 * Pure projection from a parsed files field.
 * @param {string[]|undefined} filesField
 * @param {Record<string, string>} treeFiles
 * @returns {{ok: true, files: Record<string, string>} | {ok: false, detail: string}}
 */
export function expectedPackageProjectionFromList(filesField, treeFiles) {
  const paths = Object.keys(treeFiles)
  /** @type {Set<string>} */
  const expected = new Set()
  const include = (/** @type {string} */ path) => {
    if (treeFiles[path] !== undefined) expected.add(path)
  }
  // npm always packs these when present.
  for (const path of paths) {
    if (path === 'package.json' || /^README(\..*)?$/i.test(path) || /^LICEN[CS]E(\..*)?$/i.test(path)) {
      include(path)
    }
  }
  if (filesField === undefined) {
    return { ok: false, detail: 'package.json has no files field; npm would pack the whole tree minus ignores — unsupported by this proof (fail-closed)' }
  }
  for (const entry of filesField) {
    if (typeof entry !== 'string' || entry === '') {
      return { ok: false, detail: `unsupported files entry: ${JSON.stringify(entry)}` }
    }
    if (entry.startsWith('!') || /[*?]/.test(entry)) {
      return { ok: false, detail: `unsupported files entry (negation/wildcard): ${JSON.stringify(entry)}` }
    }
    const clean = entry.replace(/\/+$/, '')
    for (const path of paths) {
      if (path === clean || path.startsWith(`${clean}/`)) expected.add(path)
    }
  }
  /** @type {Record<string, string>} */
  const files = {}
  for (const path of expected) {
    files[path] = /** @type {string} */ (treeFiles[path])
  }
  return { ok: true, files }
}

/**
 * Compare served client bytes against the installed file bytes.
 * @param {{profileDir: string, port: number}} input
 * @returns {Promise<ProofCheck & {servedSha256?: string, installedSha256?: string}>}
 */
export async function checkServedClient(input) {
  const { profileDir, port } = input
  const installedPath = installedClientPath(profileDir)
  let installedBytes
  try {
    installedBytes = await readFile(installedPath)
  } catch {
    return { ok: false, layer: 'SERVED', detail: `installed client missing at ${installedPath}` }
  }
  const installedSha256 = sha256Hex(installedBytes)
  let response
  try {
    response = await fetch(`http://127.0.0.1:${port}${SERVED_CLIENT_PATH}`, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': 'vehicle-pet-release' },
    })
  } catch (error) {
    return { ok: false, layer: 'SERVED', detail: `fetch of ${SERVED_CLIENT_PATH} failed: ${String(error)}`, installedSha256 }
  }
  if (!response.ok) {
    return { ok: false, layer: 'SERVED', detail: `served fetch returned HTTP ${response.status}`, installedSha256 }
  }
  const servedBytes = Buffer.from(await response.arrayBuffer())
  const servedSha256 = sha256Hex(servedBytes)
  if (servedSha256 !== installedSha256) {
    return {
      ok: false,
      layer: 'SERVED',
      detail: `served runtime ${servedSha256} != installed ${installedSha256} — SERVED_RUNTIME != TARGET`,
      servedSha256,
      installedSha256,
    }
  }
  return {
    ok: true,
    layer: 'SERVED',
    detail: `served == installed (${servedSha256.slice(0, 12)}…, ${servedBytes.length} bytes)`,
    servedSha256,
    installedSha256,
  }
}

/**
 * Extract the exact ref the post-install lockfile records for vehicle-pet.
 * @param {import('./lockfile.mjs').LockSummary} lockSummary
 * @returns {string|undefined}
 */
export function lockfileVehiclePetRef(lockSummary) {
  const fields = lockSummary.importerDeps['@mayf3/vehicle-pet']
  if (fields === undefined) return undefined
  const parsed = /^git\+.+#([0-9a-f]{40})$/.exec(fields.specifier ?? '')
  return parsed?.[1]
}

/**
 * Capture the currently served client hash (for preimage receipts).
 * @param {{port: number}} input
 * @returns {Promise<{sha256: string|undefined, size: number|undefined, error?: string}>}
 */
export async function captureServedClientHash(input) {
  const { port } = input
  try {
    const response = await fetch(`http://127.0.0.1:${port}${SERVED_CLIENT_PATH}`, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': 'vehicle-pet-release' },
    })
    if (!response.ok) return { sha256: undefined, size: undefined, error: `HTTP ${response.status}` }
    const bytes = Buffer.from(await response.arrayBuffer())
    return { sha256: sha256Hex(bytes), size: bytes.length }
  } catch (error) {
    return { sha256: undefined, size: undefined, error: String(error) }
  }
}

/** pnpm version string, for receipts. */
export async function pnpmVersion() {
  const result = await run('pnpm', ['--version'], { timeoutMs: 20_000 })
  return result.code === 0 ? result.stdout.trim() : `unknown (exit ${result.code})`
}

/**
 * @typedef {{ok: boolean, layer: 'INSTALL'|'CONTENT'|'SERVED', detail: string, comparedFiles?: number, servedSha256?: string, installedSha256?: string}} ProofCheck
 */
