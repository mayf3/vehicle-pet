/**
 * Preimage receipt capture (Goal 发布 §8): the minimal, reviewable record of
 * production state taken BEFORE the first mutation write, and the unique
 * receipt directory every run writes into.
 *
 * Recorded: current production ref, the exact profile package.json +
 * pnpm-lock.yaml bytes, plugin membership, other plugin resolutions,
 * service identity/command/cwd/port/health (allowlisted env only), the
 * served client hash, and the safe vehicle-pet state summary (preference
 * bytes, usage-ledger aggregates, IndexedDB aggregate summary).
 *
 * Never recorded: prompts, completions, message bodies, tool payloads,
 * credentials, browser profiles, or the DSH home. The environment is
 * allowlisted at capture time (service.mjs) so secrets cannot leak into a
 * receipt.
 * @module scripts/release/lib/preimage
 */

import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hostname } from 'node:os'
import { otherPluginResolutions } from './dshfacts.mjs'
import { timestampTag, randomTag, writeTextAtomic } from './util.mjs'

/**
 * Create the unique receipt directory for one run.
 * @param {{outRoot: string, targetRef: string, mode: string}} input
 * @returns {Promise<{receiptDir: string, receiptId: string}>}
 */
export async function createReceiptDir(input) {
  const { outRoot, targetRef, mode } = input
  const receiptId = `${timestampTag()}-${mode}-${targetRef.slice(0, 8)}-${randomTag(3)}`
  const receiptDir = join(outRoot, receiptId)
  await mkdir(join(receiptDir, 'preimage'), { recursive: true })
  // The receipt skeleton exists from the first instant, so even a run
  // rejected during git-truth verification leaves a readable receipt.
  await writeTextAtomic(join(receiptDir, 'receipt.json'), `${JSON.stringify({
    schemaVersion: 1,
    receiptId,
    mode,
    targetRef,
    steps: [],
    verdicts: {},
    result: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
  }, null, 2)}\n`)
  return { receiptDir, receiptId }
}

/**
 * Capture the full preimage into the receipt directory.
 * @param {{receiptDir: string, targetRef: string, facts: import('./dshfacts.mjs').ProfileFacts, service: (import('./service.mjs').ServiceFacts & {health: unknown})|undefined, dshHome: string, profile: string, gitTruth: unknown, stateCapture: unknown, servedClient: unknown, tool: {version: string, nodeVersion: string, pnpmVersion: string}}} input
 */
export async function capturePreimage(input) {
  const { receiptDir, receiptId, targetRef, facts, service, dshHome, profile, gitTruth, stateCapture, servedClient, tool, mode } = input
  await copyFile(facts.packageJsonPath, join(receiptDir, 'preimage', 'package.json'))
  await copyFile(facts.lockPath, join(receiptDir, 'preimage', 'pnpm-lock.yaml'))
  await writeTextAtomic(join(receiptDir, 'preimage', 'profile-facts.json'), `${JSON.stringify({
    dshHome,
    profile,
    profileDir: facts.profileDir,
    currentSpec: facts.spec,
    currentRef: facts.currentRef,
    membership: facts.membership,
    vehiclePetDependencyCount: facts.spec === undefined ? 0 : 1,
    otherPluginResolutions: otherPluginResolutions(facts.lockSummary, facts.dependencies),
  }, null, 2)}\n`)
  await writeTextAtomic(join(receiptDir, 'preimage', 'service.json'), `${JSON.stringify({
    captured: new Date().toISOString(),
    service: service === undefined ? { present: false } : {
      present: true,
      pid: service.pid,
      port: service.port,
      cmdline: service.cmdline,
      cwd: service.cwd,
      envAllowlisted: service.env,
      treePids: service.treePids,
      health: service.health,
    },
  }, null, 2)}\n`)
  await writeTextAtomic(join(receiptDir, 'preimage', 'state.json'), `${JSON.stringify({
    note: 'pet-owned browser storage only (exact key bytes + aggregate IndexedDB summary); no prompt/completion/message content, no credentials, no profile copies',
    stateCapture,
  }, null, 2)}\n`)
  await writeTextAtomic(join(receiptDir, 'preimage', 'served-client.json'), `${JSON.stringify(servedClient ?? { captured: false }, null, 2)}\n`)
  await writeTextAtomic(join(receiptDir, 'receipt.json'), `${JSON.stringify({
    schemaVersion: 1,
    tool: { name: 'vehicle-pet-release', ...tool },
    receiptId,
    host: { hostname: hostname(), capturedAt: new Date().toISOString() },
    mode,
    targetRef,
    gitTruth,
    dshHome,
    profile,
    preimage: {
      currentRef: facts.currentRef,
      currentSpec: facts.spec,
      membership: facts.membership,
    },
    steps: [],
    verdicts: {},
    result: 'IN_PROGRESS',
  }, null, 2)}\n`)
  return { receiptId, receiptDir }
}

/**
 * Update the receipt.json in place (steps/verdicts/result accumulate).
 * @param {{receiptDir: string, update: (receipt: Record<string, unknown>) => Record<string, unknown>}} input
 */
export async function updateReceipt(input) {
  const { receiptDir, update } = input
  const path = join(receiptDir, 'receipt.json')
  const { readFile } = await import('node:fs/promises')
  const current = JSON.parse(await readFile(path, 'utf8'))
  const next = update(current)
  await writeTextAtomic(path, `${JSON.stringify(next, null, 2)}\n`)
  return next
}

/**
 * Record one executed step on the receipt.
 * @param {{receiptDir: string, step: Record<string, unknown>}} input
 */
export async function appendStep(input) {
  await updateReceipt({
    receiptDir: input.receiptDir,
    update: receipt => {
      const steps = /** @type {unknown[]} */ (receipt.steps ?? [])
      steps.push({ at: new Date().toISOString(), ...input.step })
      receipt.steps = steps
      return receipt
    },
  })
}

/**
 * @param {{receiptDir: string, verdicts: Record<string, unknown>, result: string, exitCode: number, finishedAt: string, note?: string}} input
 */
export async function finalizeReceipt(input) {
  return updateReceipt({
    receiptDir: input.receiptDir,
    update: receipt => ({
      ...receipt,
      verdicts: { ...receipt.verdicts, ...input.verdicts },
      result: input.result,
      exitCode: input.exitCode,
      note: input.note,
      finishedAt: input.finishedAt,
    }),
  })
}

/** Ensure the receipt root exists before a run starts writing. */
export async function ensureReceiptRoot(outRoot) {
  await mkdir(outRoot, { recursive: true })
  await writeFile(join(outRoot, '.gitignore'), '*\n', 'utf8')
}
