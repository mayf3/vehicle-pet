/**
 * Fresh service discovery and the controlled restart (Goal 发布 §6, §11).
 *
 * The real web service management is never assumed: every run re-derives the
 * listener, process tree, command line, cwd, and environment from live OS
 * queries. The restart sends SIGTERM only to the recorded service tree,
 * relaunches the exact recorded argv/cwd/allowlisted-env detached, and
 * verifies port stability plus health. killall / pattern pkill / unrelated
 * services are structurally impossible here — every PID is an individually
 * recorded member of the matched service tree.
 * @module scripts/release/lib/service
 */

import { spawn } from 'node:child_process'
import { open } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { run, sleep, truncateForMessage } from './util.mjs'

/** Env keys considered safe to record and to hand to a relaunched service. */
const ENV_ALLOWLIST = [
  'DSH_HOME',
  'DSH_PROFILE',
  'DSH_PERMISSION_MODE',
  'DSH_TELEMETRY_DISABLED',
  'SSH_CONNECTION',
  'NODE_ENV',
]

/**
 * Discover the DSH web service for the given home/profile by scanning live
 * TCP listeners and matching each listener's process against the dsh-web
 * command shape, then matching the process environment to the expected
 * home/profile.
 * @param {{dshHome: string, profile: string, portHint?: number}} input
 * @returns {Promise<{ok: true, service: ServiceFacts} | {ok: false, reason: 'SERVICE_NOT_FOUND'|'SERVICE_AMBIGUOUS'|'SERVICE_HOME_MISMATCH', detail: string}>}
 */
export async function discoverWebService(input) {
  const { dshHome, profile, portHint } = input
  const listeners = await listListeners(portHint)
  /** @type {ServiceFacts[]} */
  const candidates = []
  for (const listener of listeners) {
    const cmdlineResult = await run('ps', ['-p', String(listener.pid), '-ww', '-o', 'command='], { timeoutMs: 10_000 })
    const cmdline = cmdlineResult.stdout.trim()
    if (cmdlineResult.code !== 0 || cmdline === '') continue
    // `web` must be an argument TOKEN: a path segment like
    // …/profiles/web/node_modules/... (the dsh-remote-plugin gateway) is
    // not the web surface.
    if (!cmdline.split(/\s+/).includes('web')) continue
    const tree = await processTree(listener.pid)
    // The listener (leaf) may not carry the `dsh` token itself (e.g.
    // `node … bin.ts web …` under a `pnpm dsh web` wrapper) — the service
    // identity requires SOME process in its tree to be the dsh command.
    if (!tree.some(entry => /\bdsh\b/.test(entry.command))) continue
    const env = await readProcessEnv(listener.pid)
    const declaredProfile = env.DSH_PROFILE ?? 'web'
    const envHome = env.DSH_HOME !== undefined ? expandHome(env.DSH_HOME) : undefined
    const homeMatches = envHome !== undefined ? envHome === dshHome : dshHome === join(homedir(), '.dsh')
    if (!homeMatches || declaredProfile !== profile) continue
    const cwd = await processCwd(listener.pid)
    let argv
    try {
      argv = tokenize(cmdline)
    } catch (error) {
      // A quoted service command line cannot be relaunch-tokenized safely;
      // report it instead of crashing the whole discovery.
      return {
        ok: false,
        reason: 'SERVICE_UNSUPPORTED_CMDLINE',
        detail: `dsh web listener on port ${listener.port} has a command line this tool refuses to tokenize: ${String(error)}`,
      }
    }
    candidates.push({
      pid: listener.pid,
      port: listener.port,
      cmdline,
      argv,
      cwd,
      env: allowlistEnv(env),
      treePids: tree.map(entry => entry.pid),
      tree,
      declaredProfile,
    })
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      reason: 'SERVICE_NOT_FOUND',
      detail: `no dsh web listener found for home ${dshHome} profile ${profile}`
        + (portHint !== undefined ? ` on port ${portHint}` : ''),
    }
  }
  if (candidates.length > 1) {
    return {
      ok: false,
      reason: 'SERVICE_AMBIGUOUS',
      detail: `${candidates.length} matching dsh web listeners (ports ${candidates.map(entry => entry.port).join(', ')}) — pass --port to disambiguate`,
    }
  }
  const service = /** @type {ServiceFacts} */ (candidates[0])
  return { ok: true, service }
}

/**
 * @typedef {object} ServiceFacts
 * @property {number} pid listener (leaf) pid
 * @property {number} port
 * @property {string} cmdline
 * @property {string[]} argv
 * @property {string} cwd
 * @property {Record<string, string>} env allowlisted environment
 * @property {number[]} treePids leaf-first service-tree pids
 * @property {{pid: number, ppid: number, command: string}[]} tree leaf-first
 * @property {string} declaredProfile
 */

/**
 * List TCP listeners, optionally restricted to one port.
 * @param {number|undefined} portHint
 * @returns {Promise<{pid: number, port: number}[]>}
 */
export async function listListeners(portHint) {
  const result = await run('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { timeoutMs: 15_000 })
  if (result.code !== 0) return []
  /** @type {{pid: number, port: number}[]} */
  const out = []
  for (const line of result.stdout.split('\n').slice(1)) {
    // `node 81538 user 407u IPv4 … TCP 127.0.0.1:3080 (LISTEN)` — the port
    // is the digits after the last colon before the trailing (LISTEN).
    const match = /:(\d+)\s+\(LISTEN\)\s*$/.exec(line.trim())
    const fields = line.trim().split(/\s+/)
    const pid = Number(fields[1])
    if (match === null || !Number.isInteger(pid) || pid <= 0) continue
    const port = Number(match[1])
    if (portHint !== undefined && port !== portHint) continue
    out.push({ pid, port })
  }
  return out
}

/**
 * Read a process's environment (macOS `ps -wwE`) filtered to the allowlist.
 * @param {number} pid
 * @returns {Promise<Record<string, string>>}
 */
export async function readProcessEnv(pid) {
  const result = await run('ps', ['-p', String(pid), '-wwE', '-o', 'command='], { timeoutMs: 10_000 })
  return parsePsEnv(result.stdout, ENV_ALLOWLIST)
}

/**
 * Parse the trailing KEY=VALUE sequence of a `ps -wwE` command= line.
 * ps does not quote values, so every value runs until the NEXT env token of
 * ANY key (not just the allowlisted ones — the allowlist only filters what
 * is KEPT). Multi-word values therefore survive, and a value can never leak
 * the following variables into itself.
 * @param {string} text full `ps -o command=` output
 * @param {readonly string[]} keys allowlisted keys to extract
 * @returns {Record<string, string>}
 */
export function parsePsEnv(text, keys) {
  /** @type {Record<string, string>} */
  const env = {}
  const tokenPattern = /(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=/g
  /** @type {{key: string, matchStart: number, valueStart: number}[]} */
  const tokens = []
  let match
  while ((match = tokenPattern.exec(text)) !== null) {
    tokens.push({ key: /** @type {string} */ (match[1]), matchStart: match.index, valueStart: match.index + match[0].length })
  }
  for (let index = 0; index < tokens.length; index += 1) {
    const token = /** @type {{key: string, matchStart: number, valueStart: number}} */ (tokens[index])
    if (!keys.includes(token.key)) continue
    const next = tokens[index + 1]
    const rawValue = next !== undefined
      ? text.slice(token.valueStart, next.matchStart)
      : text.slice(token.valueStart)
    let value = rawValue.replace(/\s+$/, '')
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1)
    }
    env[token.key] = value
  }
  return env
}

/** @param {Record<string, string>} env */
function allowlistEnv(env) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const key of ENV_ALLOWLIST) {
    if (env[key] !== undefined) out[key] = /** @type {Record<string, string>} */ (env)[key]
  }
  return out
}

/**
 * Walk the parent chain from `pid` upward, stopping at the TOPMOST service
 * node: the first process whose command carries the `dsh` entry (pnpm dsh /
 * run-dsh.ts). Everything above that (shells, agents, this tool itself) is
 * launcher context, never part of the service — recording it would let a
 * restart TERM or relaunch the launcher. Returns leaf-first.
 * @param {number} pid
 * @returns {Promise<{pid: number, ppid: number, command: string}[]>}
 */
export async function processTree(pid) {
  /** @type {{pid: number, ppid: number, command: string}[]} */
  const chain = []
  let current = pid
  for (let depth = 0; depth < 10; depth += 1) {
    const result = await run('ps', ['-p', String(current), '-o', 'pid=,ppid=,command='], { timeoutMs: 10_000 })
    if (result.code !== 0) break
    const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(result.stdout.trim())
    if (match === null) break
    const entry = { pid: Number(match[1]), ppid: Number(match[2]), command: match[3] ?? '' }
    chain.push(entry)
    if (entry.ppid <= 1) break
    if (/\bdsh\b/.test(entry.command)) break
    const parent = await run('ps', ['-p', String(entry.ppid), '-o', 'command='], { timeoutMs: 10_000 })
    const parentCommand = parent.stdout.trim()
    if (parent.code !== 0 || !/(^|\/)(node|pnpm|npm)(\s|$)/.test(parentCommand)) break
    current = entry.ppid
  }
  return chain
}

/** @param {number} pid */
export async function processCwd(pid) {
  const result = await run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { timeoutMs: 10_000 })
  for (const line of result.stdout.split('\n')) {
    if (line.startsWith('n/')) return line.slice(1)
  }
  return '(unknown)'
}

/** @param {string} value */
function expandHome(value) {
  if (value === '~') return homedir()
  if (value.startsWith('~/')) return join(homedir(), value.slice(2))
  return value
}

/**
 * Split a ps command line into argv tokens. The proven production and E2E
 * commands contain no quoted or space-bearing arguments; refuse to restart
 * anything that does, rather than mis-tokenizing a launch command.
 * @param {string} cmdline
 * @returns {string[]}
 */
export function tokenize(cmdline) {
  if (cmdline.includes('"') || cmdline.includes("'")) {
    throw new Error(`refusing service command line containing quotes: ${truncateForMessage(cmdline)}`)
  }
  const tokens = cmdline.trim().split(/\s+/)
  if (tokens.join(' ') !== cmdline.trim() || tokens.some(token => token === '')) {
    throw new Error(`refusing to tokenize service command line: ${truncateForMessage(cmdline)}`)
  }
  return tokens
}

/**
 * Health check: HTTP status of the web root.
 * @param {number} port
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number|undefined, ok: boolean, ms: number, error?: string}>}
 */
export async function healthCheck(port, timeoutMs = 5_000) {
  const started = Date.now()
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'vehicle-pet-release' },
    })
    // Drain the body so the socket closes promptly.
    await response.arrayBuffer()
    return { status: response.status, ok: response.status === 200, ms: Date.now() - started }
  } catch (error) {
    return { status: undefined, ok: false, ms: Date.now() - started, error: String(error) }
  }
}

/**
 * Check whether any OTHER process currently holds the profile's
 * package.json or pnpm-lock.yaml open (a proxy for a concurrent writer:
 * a running `pnpm install` keeps both open). Excludes processes in
 * `excludePids`.
 * @param {{packageJsonPath: string, lockPath: string, excludePids: number[]}} input
 * @returns {Promise<{exclusive: true} | {exclusive: false, holders: {pid: number, command: string}[]}>}
 */
export async function assertNoOtherWriter(input) {
  const { packageJsonPath, lockPath, excludePids } = input
  const result = await run('lsof', ['-nP', packageJsonPath, lockPath], { timeoutMs: 15_000 })
  if (result.code !== 0 && result.stdout.trim() === '') return { exclusive: true }
  /** @type {{pid: number, command: string}[]} */
  const holders = []
  const pidCache = new Map()
  for (const line of result.stdout.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/)
    const pid = Number(fields[1])
    if (!Number.isInteger(pid) || pid <= 0 || excludePids.includes(pid)) continue
    if (pidCache.has(pid)) continue
    pidCache.set(pid, true)
    const cmd = await run('ps', ['-p', String(pid), '-ww', '-o', 'command='], { timeoutMs: 10_000 })
    holders.push({ pid, command: cmd.stdout.trim() })
  }
  if (holders.length > 0) return { exclusive: false, holders }
  return { exclusive: true }
}

/**
 * Controlled restart of the discovered service (§11): SIGTERM the recorded
 * tree leaf-first, wait for exit, relaunch the exact recorded argv/cwd/env
 * detached, then require the same port and a healthy web root.
 * @param {{service: ServiceFacts, dshHome: string, profile: string, receiptDir: string, environment: Record<string, string|undefined>, timeoutMs?: number}} input
 * @returns {Promise<{ok: true, service: ServiceFacts} | {ok: false, reason: string, detail: string}>}
 */
export async function controlledRestart(input) {
  const { service, dshHome, profile, receiptDir, environment, timeoutMs = 150_000 } = input
  const beforePort = service.port
  const beforePids = service.treePids

  // TERM leaf-first, then the ancestors (the pnpm wrapper does not propagate
  // signals to the leaf — the 灵动 apply had to TERM the leaf separately).
  for (const pid of beforePids) {
    process.kill(pid, 'SIGTERM')
  }
  const exited = await waitPidsExited(beforePids, 30_000)
  if (!exited) {
    // One more TERM round for survivors, then abort rather than escalate to
    // KILL — an unresponsive service needs eyes, not a forced kill.
    for (const pid of beforePids) {
      try { process.kill(pid, 0); process.kill(pid, 'SIGTERM') } catch { /* gone */ }
    }
    const exitedAfterRetry = await waitPidsExited(beforePids, 30_000)
    if (!exitedAfterRetry) {
      return {
        ok: false,
        reason: 'RESTART_TERM_TIMEOUT',
        detail: `service pids ${beforePids.join(', ')} did not exit after two SIGTERM rounds; nothing was relaunched`,
      }
    }
  }

  const logHandle = await open(`${receiptDir}/service-restart.log`, 'a')
  // Relaunch the TOP of the recorded tree (the pnpm/node wrapper that owns
  // the service), not the leaf — this preserves the exact management shape
  // that was running before, whatever it was.
  const top = service.tree.at(-1)
  let rootArgv
  try {
    rootArgv = tokenize(top?.command ?? service.cmdline)
  } catch (error) {
    return { ok: false, reason: 'RESTART_UNSUPPORTED_CMDLINE', detail: String(error) }
  }
  const child = spawn(rootArgv[0] ?? 'pnpm', rootArgv.slice(1), {
    cwd: service.cwd,
    env: {
      ...environment,
      ...service.env,
      PATH: environment.PATH ?? process.env.PATH,
      HOME: environment.HOME ?? process.env.HOME,
      TMPDIR: environment.TMPDIR ?? process.env.TMPDIR,
    },
    detached: true,
    stdio: ['ignore', logHandle.fd, logHandle.fd],
  })
  child.unref()
  const childPid = child.pid
  // The spawn handle may report an immediate spawn failure via 'error'.
  const spawnError = await new Promise((resolve) => {
    child.once('error', error => resolve(error))
    setTimeout(() => resolve(null), 250)
  })
  await logHandle.close()
  if (spawnError !== null) {
    return { ok: false, reason: 'RESTART_SPAWN_FAILED', detail: String(spawnError) }
  }

  const deadline = Date.now() + timeoutMs
  let lastHealth = await healthCheck(beforePort, 2_000)
  while (Date.now() < deadline) {
    await sleep(1_500)
    lastHealth = await healthCheck(beforePort, 3_000)
    if (lastHealth.ok) break
  }
  if (!lastHealth.ok) {
    return {
      ok: false,
      reason: 'RESTART_HEALTH_TIMEOUT',
      detail: `relaunched service (spawned pid ${childPid}) did not become healthy on port ${beforePort} within ${timeoutMs} ms: ${JSON.stringify(lastHealth)}`,
    }
  }
  const after = await discoverWebService({
    dshHome,
    profile,
    portHint: beforePort,
  })
  if (!after.ok) {
    // The port answers but discovery cannot re-match (e.g. env allowlist
    // differs) — record what we know; the caller decides.
    return {
      ok: false,
      reason: 'RESTART_DISCOVERY_MISMATCH',
      detail: `port ${beforePort} is healthy but service re-discovery failed: ${after.reason}: ${after.detail}`,
    }
  }
  if (after.service.port !== beforePort) {
    return {
      ok: false,
      reason: 'RESTART_PORT_CHANGED',
      detail: `WEB_PORT_BEFORE=${beforePort} WEB_PORT_AFTER=${after.service.port}`,
    }
  }
  return { ok: true, service: after.service }
}

/**
 * @param {number[]} pids
 * @param {number} timeoutMs
 * @returns {Promise<boolean>} true when every pid has exited
 */
async function waitPidsExited(pids, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    let alive = 0
    for (const pid of pids) {
      try { process.kill(pid, 0); alive += 1 } catch { /* exited */ }
    }
    if (alive === 0) return true
    if (Date.now() >= deadline) return false
    await sleep(500)
  }
}
