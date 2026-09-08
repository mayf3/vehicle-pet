/**
 * Shared low-level helpers for the Vehicle Pet release tool: child-process
 * execution with bounds, hashing, JSON IO, and small async utilities.
 * Every external command runs through `run` with argv arrays (never a
 * shell) and a hard timeout, so a hung subsystem can only fail its own
 * step, never the runbook's abort semantics.
 * @module scripts/release/lib/util
 */

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile, rename } from 'node:fs/promises'

export const TOOL_NAME = 'vehicle-pet-release'
export const TOOL_VERSION = '1.0.1'

/**
 * Run one command to completion.
 * @param {string} file executable resolved via PATH (no shell interpretation).
 * @param {readonly string[]} args argv array passed verbatim.
 * @param {{cwd?: string, env?: Record<string, string|undefined>, timeoutMs?: number, input?: string, maxBytes?: number}} [options]
 * @returns {Promise<{code: number|null, signal: string|null, stdout: string, stderr: string, timedOut: boolean}>}
 */
export function run(file, args, options = {}) {
  const { cwd, env, timeoutMs = 60_000, input, maxBytes = 2_000_000 } = options
  return new Promise((resolve) => {
    const child = spawn(file, args, {
      cwd,
      env,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false
    const timer = setTimeout(() => {
      timedOut = true
      try { child.kill('SIGKILL') } catch { /* already gone */ }
    }, timeoutMs)
    const cap = (current, chunk) => (current.length < maxBytes ? current + chunk : current)
    child.stdout?.on('data', chunk => { stdout = cap(stdout, chunk) })
    child.stderr?.on('data', chunk => { stderr = cap(stderr, chunk) })
    const finish = (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ code, signal, stdout, stderr, timedOut })
    }
    child.on('error', error => {
      stderr += `\n${String(error)}`
      finish(null, null)
    })
    child.on('close', (code, signal) => finish(code, signal))
    if (input !== undefined) {
      child.stdin?.end(input)
    }
  })
}

/**
 * Run a command and throw a tagged Error on non-zero exit or timeout.
 * @param {string} file
 * @param {readonly string[]} args
 * @param {{cwd?: string, env?: Record<string, string|undefined>, timeoutMs?: number, what: string}} options
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function runOk(file, args, options) {
  const result = await run(file, args, options)
  if (result.code !== 0) {
    throw new Error(
      `${options.what} failed (exit ${result.code}${result.timedOut ? ', timeout' : ''}): `
      + truncateForMessage(result.stderr || result.stdout),
    )
  }
  return result
}

/**
 * @param {string} text
 * @param {number} [limit]
 */
export function truncateForMessage(text, limit = 400) {
  const flat = text.trim().replace(/\s+/g, ' ')
  return flat.length <= limit ? flat : `${flat.slice(0, limit)}…`
}

/** @param {string} data */
export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Read a file as utf8, or return undefined when absent.
 * @param {string} path
 */
export async function readTextOrNull(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * Read and parse a JSON file, or return undefined when absent.
 * @param {string} path
 */
export async function readJsonOrNull(path) {
  const text = await readTextOrNull(path)
  if (text === undefined) return undefined
  return JSON.parse(text)
}

/**
 * Atomic write: temp file in the same directory, then rename over the target.
 * @param {string} path
 * @param {string} data
 */
export async function writeTextAtomic(path, data) {
  const temp = `${path}.vp-release-tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`
  await writeFile(temp, data, 'utf8')
  await rename(temp, path)
}

/**
 * Structural equality with a stable object key order.
 * @param {unknown} a
 * @param {unknown} b
 */
export function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(/** @type {Record<string, unknown>} */ (a)).sort()
    const kb = Object.keys(/** @type {Record<string, unknown>} */ (b)).sort()
    if (!deepEqual(ka, kb)) return false
    const recordA = /** @type {Record<string, unknown>} */ (a)
    const recordB = /** @type {Record<string, unknown>} */ (b)
    return ka.every(key => deepEqual(recordA[key], recordB[key]))
  }
  return false
}

/** @param {number} ms */
export function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

/** @returns {string} e.g. `2026-09-08T12-34-56-789Z` (filesystem-safe UTC stamp). */
export function timestampTag() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

/** @param {number} [bytes=8] */
export function randomTag(bytes = 4) {
  return createHash('sha256').update(String(Math.random()) + String(process.pid) + String(Date.now()))
    .digest('hex').slice(0, bytes * 2)
}
