/**
 * Fresh DSH fact recovery (Goal 发布 §6): profile paths, the production
 * vehicle-pet pin, plugin membership, and the lockfile. Nothing here is
 * cached between runs; every value is read from disk at call time. Memory
 * PIDs, previous receipts, local main, and stale worktrees are never
 * consulted.
 * @module scripts/release/lib/dshfacts
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFile, stat } from 'node:fs/promises'
import { VEHICLE_PET_PACKAGE, summarizeLockfile } from './lockfile.mjs'
import { readTextOrNull } from './util.mjs'

/**
 * Resolve the DSH home the same way the harness does (`$DSH_HOME` else
 * `~/.dsh`), with the CLI override taking highest precedence.
 * @param {string|undefined} cliValue
 * @param {Record<string, string|undefined>} [env]
 */
export function resolveDshHome(cliValue, env = process.env) {
  if (cliValue !== undefined && cliValue.trim() !== '') return join(cliValue.trim())
  const fromEnv = env.DSH_HOME
  if (fromEnv !== undefined && fromEnv.trim() !== '') return join(fromEnv.trim())
  return join(homedir(), '.dsh')
}

/** @param {string} home @param {string} profile */
export function profileDirOf(home, profile) {
  return join(home, 'profiles', profile)
}

/**
 * Parse the profile's vehicle-pet dependency spec. Only the production shape
 * is supported: `git+<url>#<40-hex>`. Anything else is reported unsupported
 * and stops an apply (the tool never guesses a ref from a floating spec).
 * @param {string|undefined} spec
 * @returns {{kind: 'git-fixed-ref', url: string, ref: string} | {kind: 'missing'} | {kind: 'unsupported', value: string|undefined}}
 */
export function parseVehiclePetSpec(spec) {
  if (spec === undefined) return { kind: 'missing' }
  const match = /^git\+(.+)#([0-9a-f]{40})$/.exec(spec.trim())
  if (match === null) return { kind: 'unsupported', value: spec }
  return { kind: 'git-fixed-ref', url: `git+${match[1]}`, ref: match[2] ?? '' }
}

/**
 * Read the profile's package.json and pnpm-lock.yaml.
 * @param {string} profileDir
 * @returns {Promise<{ok: true, facts: ProfileFacts} | {ok: false, reason: string, detail: string}>}
 */
export async function readProfileFacts(profileDir) {
  const packageJsonPath = join(profileDir, 'package.json')
  const lockPath = join(profileDir, 'pnpm-lock.yaml')
  const rawPackageJson = await readTextOrNull(packageJsonPath)
  if (rawPackageJson === undefined) {
    return { ok: false, reason: 'PROFILE_NOT_FOUND', detail: `no package.json at ${packageJsonPath}` }
  }
  let packageJson
  try {
    packageJson = JSON.parse(rawPackageJson)
  } catch (error) {
    return { ok: false, reason: 'PROFILE_PACKAGE_JSON_UNPARSEABLE', detail: String(error) }
  }
  const rawLock = await readTextOrNull(lockPath)
  if (rawLock === undefined) {
    return { ok: false, reason: 'PROFILE_LOCK_NOT_FOUND', detail: `no pnpm-lock.yaml at ${lockPath}` }
  }
  const lockSummaryResult = summarizeLockfile(rawLock)
  if (!lockSummaryResult.ok) {
    return { ok: false, reason: lockSummaryResult.reason, detail: lockSummaryResult.detail }
  }
  const lockSummary = lockSummaryResult.summary
  const dependencies = packageJson.dependencies ?? {}
  const spec = dependencies[VEHICLE_PET_PACKAGE]
  const parsedSpec = parseVehiclePetSpec(spec)
  /** @type {ProfileFacts} */
  const facts = {
    profileDir,
    packageJsonPath,
    lockPath,
    rawPackageJson,
    rawLock,
    lockSummary,
    dependencies: { ...dependencies },
    spec,
    parsedSpec,
    currentRef: parsedSpec.kind === 'git-fixed-ref' ? parsedSpec.ref : undefined,
    membership: Array.isArray(packageJson.dsh?.profile?.bundles)
      ? /** @type {string[]} */ (packageJson.dsh.profile.bundles)
      : undefined,
  }
  return { ok: true, facts }
}

/**
 * @typedef {object} ProfileFacts
 * @property {string} profileDir
 * @property {string} packageJsonPath
 * @property {string} lockPath
 * @property {string} rawPackageJson exact bytes on disk
 * @property {string} rawLock exact bytes on disk
 * @property {import('./lockfile.mjs').LockSummary} lockSummary
 * @property {Record<string, string>} dependencies
 * @property {string|undefined} spec
 * @property {ReturnType<typeof parseVehiclePetSpec>} parsedSpec
 * @property {string|undefined} currentRef exact ref when the spec is a git-fixed-ref, else undefined
 * @property {string[]|undefined} membership dsh.profile.bundles array (order preserved)
 */

/**
 * Build the surgical pin replacement for the vehicle-pet spec: same base
 * URL, new exact ref. The rewrite is a byte-level string replacement of the
 * old spec value only; the caller re-parses and verifies nothing else moved.
 * @param {string} rawPackageJson
 * @param {string} oldSpec
 * @param {{url: string, ref: string}} target
 * @returns {{ok: true, text: string} | {ok: false, reason: 'CURRENT_SPEC_UNSUPPORTED'|'PIN_REWRITE_FAILED', detail: string}}
 */
export function buildPinnedPackageJson(rawPackageJson, oldSpec, target) {
  const newSpec = `${target.url}#${target.ref}`
  const occurrences = rawPackageJson.split(JSON.stringify(oldSpec)).length - 1
  if (occurrences !== 1) {
    return {
      ok: false,
      reason: 'PIN_REWRITE_FAILED',
      detail: `expected exactly one occurrence of the current spec in package.json, found ${occurrences}`,
    }
  }
  const text = rawPackageJson.split(JSON.stringify(oldSpec)).join(JSON.stringify(newSpec))
  try {
    JSON.parse(text)
  } catch (error) {
    return { ok: false, reason: 'PIN_REWRITE_FAILED', detail: `rewritten package.json does not parse: ${error}` }
  }
  return { ok: true, text }
}

/**
 * Verify a rewritten package.json differs from the original in exactly one
 * semantic place: the vehicle-pet dependency spec.
 * @param {string} beforeText
 * @param {string} afterText
 * @param {string} expectedNewSpec
 */
export function rewriteDeltaIsSurgical(beforeText, afterText, expectedNewSpec) {
  const before = JSON.parse(beforeText)
  const after = JSON.parse(afterText)
  const depsBefore = { ...before.dependencies }
  const depsAfter = { ...after.dependencies }
  const oldValue = depsBefore[VEHICLE_PET_PACKAGE]
  depsBefore[VEHICLE_PET_PACKAGE] = expectedNewSpec
  depsAfter[VEHICLE_PET_PACKAGE] = expectedNewSpec
  before.dependencies = depsBefore
  after.dependencies = depsAfter
  return deepEqualNormalized(before, after) && oldValue !== expectedNewSpec
}

/**
 * deepEqual with object key order normalized (JSON.parse preserves file
 * order, which the byte rewrite never changes, but compare semantically).
 * @param {unknown} a
 * @param {unknown} b
 */
function deepEqualNormalized(a, b) {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqualNormalized(item, b[index]))
  }
  const recordA = /** @type {Record<string, unknown>} */ (a)
  const recordB = /** @type {Record<string, unknown>} */ (b)
  const keysA = Object.keys(recordA).sort()
  const keysB = Object.keys(recordB).sort()
  if (keysA.length !== keysB.length || !keysA.every((key, index) => key === keysB[index])) return false
  return keysA.every(key => deepEqualNormalized(recordA[key], recordB[key]))
}

/**
 * Summary of the other plugins' resolutions from the lockfile, for the
 * preimage receipt (§8: other plugin refs).
 * @param {import('./lockfile.mjs').LockSummary} lockSummary
 * @param {Record<string, string>} dependencies
 */
export function otherPluginResolutions(lockSummary, dependencies) {
  /** @type {Record<string, {spec: string, lockedVersion: string|undefined}>} */
  const out = {}
  for (const [name, spec] of Object.entries(dependencies)) {
    if (name === VEHICLE_PET_PACKAGE) continue
    out[name] = { spec, lockedVersion: lockSummary.importerDeps[name]?.version }
  }
  return out
}

/**
 * The vehicle-pet plugin's installed client bundle path.
 * @param {string} profileDir
 */
export function installedClientPath(profileDir) {
  return join(profileDir, 'node_modules', '@mayf3', 'vehicle-pet', 'lib', 'client.js')
}

/** The served URL path of the plugin client on the DSH web app. */
export const SERVED_CLIENT_PATH = '/plugins/@mayf3/vehicle-pet/client.js'

/**
 * @param {string} profileDir
 */
export async function installedPackageDirExists(profileDir) {
  try {
    return (await stat(join(profileDir, 'node_modules', '@mayf3', 'vehicle-pet'))).isDirectory()
  } catch {
    return false
  }
}

/**
 * Read the installed package's client.js bytes.
 * @param {string} profileDir
 * @returns {Promise<string|undefined>}
 */
export async function readInstalledClientBytes(profileDir) {
  return readTextOrNull(installedClientPath(profileDir))
}

/** Re-export for callers that only need the package name constant. */
export { VEHICLE_PET_PACKAGE }

/**
 * @param {string} path
 * @returns {Promise<Buffer|undefined>}
 */
export async function readFileOrNull(path) {
  try {
    return await readFile(path)
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return undefined
    throw error
  }
}
