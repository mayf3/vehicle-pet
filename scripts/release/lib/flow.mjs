/**
 * Release flow orchestration (Goal 发布 §5-§14): one tested standard path for
 * preflight-plan (read-only), apply (the only production-mutating mode), and
 * rollback (fixed to the receipt's preimage ref).
 *
 * Ordering is deliberate and auditable:
 *   validate ref → git truth → fresh facts → service discovery → health →
 *   state probe (pre) → NO_OP check → [apply] concurrency gate →
 *   pre-install consistency gate → pin → install → post drift gate →
 *   membership gate → controlled restart → runtime proof → postflight.
 *
 * Every stop condition is reported with a STOPPED_* / REJECT / FAILED
 * result, a written receipt, and a nonzero exit code — never silently
 * absorbed.
 * @module scripts/release/lib/flow
 */

import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateExactRef, verifyRefFromOrigin } from './refs.mjs'
import { resolveDshHome, profileDirOf, readProfileFacts, buildPinnedPackageJson, rewriteDeltaIsSurgical } from './dshfacts.mjs'
import { classifyLockDrift, preInstallConsistency, summarizeLockfile, VEHICLE_PET_PACKAGE } from './lockfile.mjs'
import { discoverWebService, healthCheck, assertNoOtherWriter, controlledRestart } from './service.mjs'
import { capturePetState, comparePetState } from './stateprobe.mjs'
import { capturePreimage, createReceiptDir, appendStep, finalizeReceipt, ensureReceiptRoot } from './preimage.mjs'
import { runtimeProof, lockfileVehiclePetRef, captureServedClientHash, pnpmVersion } from './proof.mjs'
import { run, sha256Hex, deepEqual, writeTextAtomic, TOOL_VERSION } from './util.mjs'

/**
 * Shared options for every flow entry.
 * @typedef {object} FlowOptions
 * @property {string} repo vehicle-pet repository for git truth (object access only)
 * @property {string|undefined} dshHomeOverride
 * @property {string} profile
 * @property {number|undefined} portHint
 * @property {string} cdpUrl
 * @property {string[]} originPatterns source strings for web-origin matching
 * @property {string} outRoot receipt root
 * @property {boolean} allowMissingStateProbe apply-only waiver (runbook discourages)
 * @property {boolean} json emit machine receipt on stdout
 * @property {boolean} skipStateProbe plan-mode escape for hermetic tests
 */

/**
 * Preflight + plan stage: fully read-only outside the receipt directory.
 * @param {{targetInput: string, options: FlowOptions}} input
 * @returns {Promise<{exitCode: number, receipt?: object}>}
 */
export async function runPlan(input) {
  const { targetInput, options } = input
  const refCheck = validateExactRef(targetInput)
  if (!refCheck.ok) {
    return reportReject({ options, reason: refCheck.reason, detail: refCheck.detail, targetRef: null })
  }
  const targetRef = refCheck.ref
  const preflight = await preflightStage({ targetRef, options, mode: 'plan' })
  if (preflight.rejected !== undefined) {
    return reportReject({ options, targetRef, reason: preflight.rejected.reason, detail: preflight.rejected.detail, receiptDir: preflight.receiptDir })
  }

  const { facts, receiptDir } = preflight
  const plan = buildPlan({ facts, targetRef })
  const verdicts = { ...preflight.verdicts, ...plan.verdicts }
  const result = plan.kind === 'NO_OP_ALREADY_AT_TARGET'
    ? 'NO_OP_ALREADY_AT_TARGET'
    : plan.kind === 'BLOCKED' ? 'PLAN_BLOCKED' : 'PLAN_READY'
  const exitCode = plan.kind === 'BLOCKED' ? 2 : 0
  await finalizeReceipt({
    receiptDir,
    verdicts: { ...verdicts, ZERO_MUTATION: { verdict: 'PASS', detail: 'YES (plan mode writes nothing outside the receipt dir)' } },
    result,
    exitCode,
    finishedAt: new Date().toISOString(),
    note: plan.detail,
  })
  return emitResult({
    options,
    exitCode,
    receiptDir,
    summary: [
      `TARGET_REF            ${targetRef}`,
      `CURRENT_PRODUCTION_REF ${facts.currentRef ?? '(unsupported spec shape)'}`,
      `RESULT                ${result}`,
      plan.detail,
      `receipt               ${receiptDir}`,
    ],
  })
}

/**
 * Apply stage (§5: the only mode allowed to mutate production).
 * @param {{targetInput: string, options: FlowOptions}} input
 * @returns {Promise<{exitCode: number, receipt?: object}>}
 */
export async function runApply(input) {
  const { targetInput, options } = input
  const refCheck = validateExactRef(targetInput)
  if (!refCheck.ok) {
    return reportReject({ options, reason: refCheck.reason, detail: refCheck.detail, targetRef: null })
  }
  const targetRef = refCheck.ref
  const preflight = await preflightStage({ targetRef, options, mode: 'apply' })
  if (preflight.rejected !== undefined) {
    return reportReject({ options, targetRef, reason: preflight.rejected.reason, detail: preflight.rejected.detail, receiptDir: preflight.receiptDir })
  }

  const { facts, receiptDir, service, stateCapture } = preflight
  if (facts.parsedSpec.kind === 'unsupported') {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'CURRENT_SPEC_UNSUPPORTED',
      detail: `current profile spec ${JSON.stringify(facts.spec)} is not a git-fixed-ref; refusing to derive a production ref from it`,
      verdicts: {},
      exitCode: 3,
    })
  }

  const plan = buildPlan({ facts, targetRef })
  if (plan.kind === 'NO_OP_ALREADY_AT_TARGET') {
    await finalizeReceipt({
      receiptDir,
      verdicts: {
        ...preflight.verdicts,
        NO_OP: { verdict: 'PASS', detail: 'already at target' },
        ZERO_MUTATION: { verdict: 'PASS', detail: 'YES — no install, no restart, no preference write, no package/lock write' },
      },
      result: 'NO_OP_ALREADY_AT_TARGET',
      exitCode: 0,
      finishedAt: new Date().toISOString(),
    })
    return emitResult({
      options,
      exitCode: 0,
      receiptDir,
      summary: [
        `TARGET_REF             ${targetRef}`,
        `CURRENT_PRODUCTION_REF ${facts.currentRef}`,
        `RESULT                 NO_OP_ALREADY_AT_TARGET`,
        `ZERO_MUTATION          YES`,
        `receipt                ${receiptDir}`,
      ],
    })
  }
  if (service === undefined) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'SERVICE_NOT_HEALTHY',
      detail: 'web service must be healthy before an apply; refusing to mutate without a verifiable restart path',
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }

  // ---- concurrency gate (§10) -------------------------------------------
  // The running web service itself holds watch descriptors on these files;
  // it is not a concurrent writer (it is quiesced by the restart step), so
  // its recorded tree is excluded. Any OTHER holder stops the apply.
  const writerCheck = await assertNoOtherWriter({
    packageJsonPath: facts.packageJsonPath,
    lockPath: facts.lockPath,
    excludePids: [process.pid, ...(service.treePids ?? [])],
  })
  await appendStep({ receiptDir, step: { step: 'CONCURRENCY_GATE', outcome: writerCheck.exclusive ? 'PASS' : 'STOPPED', holders: writerCheck.exclusive ? [] : writerCheck.holders } })
  if (!writerCheck.exclusive) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'STOPPED_AT_CONCURRENT_WRITER',
      detail: `other processes hold the profile package.json/lockfile open: ${writerCheck.holders.map(holder => `${holder.pid} ${holder.command}`).join('; ')}`,
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }
  const rereadRaw = await readFile(facts.packageJsonPath, 'utf8')
  if (rereadRaw !== facts.rawPackageJson) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'STOPPED_AT_CONCURRENT_WRITER',
      detail: 'profile package.json changed between preimage and pin; another writer is active',
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }

  // ---- pre-install consistency gate (§9, RISK_3) -------------------------
  const consistency = preInstallConsistency({ packageDeps: facts.dependencies, lock: facts.lockSummary })
  await appendStep({ receiptDir, step: { step: 'PRE_INSTALL_CONSISTENCY', outcome: consistency.ok ? 'PASS' : 'STOPPED', drift: consistency.ok ? [] : consistency.drift } })
  if (!consistency.ok) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'UNRELATED_DEPENDENCY_DRIFT',
      detail: `pre-install consistency gate stopped the apply before any install/restart: ${consistency.drift.join('; ')}`,
      verdicts: { ...preflight.verdicts, UNRELATED_DEPENDENCY_DRIFT: { verdict: 'REJECTED', detail: consistency.drift, phase: 'PRE_INSTALL' } },
      exitCode: 3,
    })
  }

  // ---- pin (§9: only @mayf3/vehicle-pet changes) --------------------------
  const fromRef = /** @type {string} */ (facts.currentRef)
  const target = facts.parsedSpec.kind === 'git-fixed-ref'
    ? { url: facts.parsedSpec.url, ref: targetRef }
    : undefined
  if (target === undefined) {
    return stopApply({ options, receiptDir, targetRef, reason: 'CURRENT_SPEC_UNSUPPORTED', detail: 'unreachable', verdicts: preflight.verdicts, exitCode: 3 })
  }
  const pinned = buildPinnedPackageJson(facts.rawPackageJson, /** @type {string} */ (facts.spec), target)
  if (!pinned.ok) {
    return stopApply({ options, receiptDir, targetRef, reason: pinned.reason, detail: pinned.detail, verdicts: preflight.verdicts, exitCode: 3 })
  }
  const pinnedText = /** @type {string} */ (pinned.text)
  if (!rewriteDeltaIsSurgical(facts.rawPackageJson, pinnedText, `${target.url}#${target.ref}`)) {
    return stopApply({ options, receiptDir, targetRef, reason: 'PIN_REWRITE_FAILED', detail: 'rewritten package.json is not a surgical single-dependency delta', verdicts: preflight.verdicts, exitCode: 3 })
  }
  await writeTextAtomic(facts.packageJsonPath, pinnedText)
  await appendStep({ receiptDir, step: { step: 'PIN', outcome: 'DONE', from: `${target.url}#${fromRef}`, to: `${target.url}#${targetRef}` } })

  // ---- install + post drift gate (§9) ------------------------------------
  const install = await run('pnpm', ['install'], { cwd: facts.profileDir, timeoutMs: 600_000, env: process.env })
  await appendStep({
    receiptDir,
    step: { step: 'INSTALL', outcome: install.code === 0 ? 'DONE' : 'FAILED', exitCode: install.code, tail: (install.stderr || install.stdout).split('\n').slice(-8).join('\n') },
  })
  if (install.code !== 0) {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'INSTALL_FAILED',
      detail: `pnpm install failed (exit ${install.code})${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}`,
      verdicts: preflight.verdicts,
      exitCode: 4,
    })
  }
  const postLockRaw = await readFile(facts.lockPath, 'utf8')
  const postSummary = summarizeLockfile(postLockRaw)
  if (!postSummary.ok) {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: postSummary.reason,
      detail: `post-install lockfile unparseable${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}`,
      verdicts: preflight.verdicts,
      exitCode: 4,
    })
  }
  const drift = classifyLockDrift({ pre: facts.lockSummary, post: postSummary.summary, fromRef, toRef: targetRef })
  await appendStep({ receiptDir, step: { step: 'LOCK_DRIFT_GATE', outcome: drift.ok ? 'PASS' : 'STOPPED', drift: drift.ok ? [] : drift.drift } })
  if (!drift.ok && drift.reason === 'UNRELATED_DEPENDENCY_DRIFT') {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'UNRELATED_DEPENDENCY_DRIFT',
      detail: `unrelated dependency resolution drift detected; stopped before restart${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}`,
      verdicts: {
        ...preflight.verdicts,
        UNRELATED_DEPENDENCY_DRIFT: { verdict: 'REJECTED', phase: 'POST_INSTALL', drift: drift.drift, reverted: revert.ok },
      },
      exitCode: 3,
    })
  }
  if (!drift.ok) {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: drift.reason,
      detail: `vehicle-pet lockfile anomaly${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}: ${drift.detail}`,
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }

  // ---- membership gate (§8/§13) -------------------------------------------
  const postFacts = await readProfileFacts(facts.profileDir)
  if (!postFacts.ok) {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: postFacts.reason,
      detail: `post-install profile unreadable${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}`,
      verdicts: preflight.verdicts,
      exitCode: 4,
    })
  }
  const membershipPreserved = deepEqual(facts.membership, postFacts.facts.membership)
  await appendStep({ receiptDir, step: { step: 'MEMBERSHIP_GATE', outcome: membershipPreserved ? 'PASS' : 'STOPPED', before: facts.membership, after: postFacts.facts.membership } })
  if (!membershipPreserved) {
    const revert = await revertToPreimage({ facts, receiptDir })
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'MEMBERSHIP_DRIFT',
      detail: `dsh.profile.bundles changed during install${revert.ok ? '; profile reverted to preimage' : `; AUTO-REVERT FAILED: ${revert.detail}`}`,
      verdicts: { ...preflight.verdicts, MEMBERSHIP_PRESERVED: { verdict: 'FAIL' } },
      exitCode: 3,
    })
  }

  // ---- controlled restart (§11) -------------------------------------------
  await appendStep({ receiptDir, step: { step: 'RESTART', outcome: 'STARTED', webPortBefore: service.port } })
  const restart = await controlledRestart({
    service,
    dshHome: preflight.dshHome,
    profile: options.profile,
    receiptDir,
    environment: process.env,
  })
  if (!restart.ok) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: restart.reason,
      detail: `${restart.detail} — package is installed at ${targetRef} but the restart failed; run rollback --receipt ${receiptDir} if the web service is not wanted at ${targetRef}`,
      verdicts: { ...preflight.verdicts, CONTROLLED_RESTART: { verdict: 'FAIL', detail: restart.reason } },
      exitCode: 4,
    })
  }
  await appendStep({ receiptDir, step: { step: 'RESTART', outcome: 'DONE', webPortAfter: restart.service.port, newLeafPid: restart.service.pid, health: 'PASS' } })

  // ---- runtime proof (§12) --------------------------------------------------
  const proof = await runtimeProof({
    profileDir: facts.profileDir,
    repo: options.repo,
    ref: targetRef,
    lockRef: lockfileVehiclePetRef(postFacts.facts.lockSummary),
    port: restart.service.port,
  })
  await appendStep({
    receiptDir,
    step: {
      step: 'RUNTIME_PROOF',
      outcome: proof.ok ? 'PASS' : 'FAILED',
      install: proof.install,
      content: proof.content,
      served: proof.served,
    },
  })
  if (!proof.ok) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'RUNTIME_PROOF_FAILED',
      detail: [
        proof.install.ok ? null : `INSTALL: ${proof.install.detail}`,
        proof.content.ok ? null : `CONTENT: ${proof.content.detail}`,
        proof.served.ok ? null : `SERVED: ${proof.served.detail}`,
      ].filter(Boolean).join(' | '),
      verdicts: { ...preflight.verdicts, RUNTIME_PROOF: { verdict: 'FAIL', detail: { install: proof.install, content: proof.content, served: proof.served } } },
      exitCode: 4,
    })
  }

  // ---- postflight: state preservation (§13) ---------------------------------
  const postState = options.skipStateProbe
    ? { status: 'UNAVAILABLE', targets: [], reason: 'state probe disabled by flag' }
    : await capturePetState({ cdpUrl: options.cdpUrl, originPatterns: preflight.originRegexps })
  const stateVerdicts = comparePetState({ pre: stateCapture, post: postState })
  const probeUnavailable = stateVerdicts.STATE_PROBE?.verdict === 'UNAVAILABLE'
  await appendStep({ receiptDir, step: { step: 'STATE_POSTFLIGHT', outcome: probeUnavailable ? 'UNAVAILABLE' : 'DONE', verdicts: stateVerdicts } })
  await writeTextAtomic(join(receiptDir, 'postimage', 'state.json'), `${JSON.stringify({ note: 'pet-owned browser storage after apply', stateCapture: postState }, null, 2)}\n`).catch(() => {})
  if (probeUnavailable && !options.allowMissingStateProbe) {
    return stopApply({
      options, receiptDir, targetRef,
      reason: 'STATE_PROBE_UNAVAILABLE',
      detail: 'post-apply state preservation could not be verified (no browser tab matching the web origin). The upgrade itself succeeded; run the state verification with the tab open, or re-run with --allow-missing-state-probe to acknowledge the gap.',
      verdicts: { ...preflight.verdicts, RUNTIME_PROOF: { verdict: 'PASS' }, ...stateVerdicts },
      exitCode: 4,
    })
  }

  const stateOk = Object.entries(stateVerdicts).every(([name, verdict]) =>
    name === 'STATE_PROBE' || verdict.verdict !== 'FAIL')
  const otherPreserved = preflight.verdicts.OTHER_PLUGINS_PRESERVED?.verdict !== 'FAIL'
  const result = stateOk && otherPreserved ? 'APPLY_COMPLETE' : 'APPLY_COMPLETE_WITH_STATE_FAILURES'
  const exitCode = stateOk && otherPreserved ? 0 : 4
  await finalizeReceipt({
    receiptDir,
    verdicts: {
      ...preflight.verdicts,
      RUNTIME_PROOF: { verdict: 'PASS', detail: { install: proof.install.detail, content: proof.content.detail, served: proof.served.detail } },
      CONTROLLED_RESTART: { verdict: 'PASS', detail: `port ${service.port} → ${restart.service.port}, health PASS` },
      ...stateVerdicts,
    },
    result,
    exitCode,
    finishedAt: new Date().toISOString(),
    note: stateOk ? undefined : 'state preservation failures recorded above',
  })
  return emitResult({
    options,
    exitCode,
    receiptDir,
    summary: [
      `TARGET_REF        ${targetRef}`,
      `RUNTIME_PROOF     PASS (install + content + served)`,
      `RESTART           port ${service.port} → ${restart.service.port}, health PASS`,
      `STATE_PRESERVATION ${probeUnavailable ? 'UNAVAILABLE' : stateOk ? 'PASS' : 'FAIL (see receipt)'}`,
      `RESULT            ${result}`,
      `receipt           ${receiptDir}`,
    ],
  })
}

/**
 * Rollback (§14): the preimage production ref is the rollback ref. Restores
 * the exact preimage package.json bytes, installs, re-checks drift,
 * restarts the web service, and re-proves runtime identity against the
 * PREIMAGE ref.
 * @param {{receiptPath: string, options: FlowOptions}} input
 * @returns {Promise<{exitCode: number, receipt?: object}>}
 */
export async function runRollback(input) {
  const { receiptPath, options } = input
  const receiptDir = receiptPath.replace(/\/receipt\.json$/, '')
  let receipt
  try {
    receipt = JSON.parse(await readFile(join(receiptDir, 'receipt.json'), 'utf8'))
  } catch (error) {
    return reportReject({ options, reason: 'ROLLBACK_RECEIPT_INVALID', detail: `cannot read receipt at ${receiptDir}: ${String(error)}`, targetRef: null })
  }
  const rollbackRef = receipt?.preimage?.currentRef
  const targetRef = receipt?.targetRef
  if (typeof rollbackRef !== 'string' || typeof targetRef !== 'string') {
    return reportReject({ options, reason: 'ROLLBACK_RECEIPT_INVALID', detail: 'receipt lacks preimage.currentRef / targetRef', targetRef: null })
  }
  let preimagePackageJson
  try {
    preimagePackageJson = await readFile(join(receiptDir, 'preimage', 'package.json'), 'utf8')
  } catch (error) {
    return reportReject({ options, reason: 'ROLLBACK_RECEIPT_INVALID', detail: `preimage package.json missing: ${String(error)}`, targetRef: rollbackRef })
  }

  const preflight = await preflightStage({ targetRef: rollbackRef, options, mode: 'rollback' })
  if (preflight.rejected !== undefined) {
    return reportReject({ options, targetRef: rollbackRef, reason: preflight.rejected.reason, detail: preflight.rejected.detail, receiptDir: preflight.receiptDir })
  }
  const { facts, receiptDir: rollbackReceiptDir, service } = preflight

  // Rollback is only legal from the exact applied target state (fixed to the
  // receipt's preimage; never a free-form "go to any ref").
  if (facts.currentRef !== targetRef) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: 'ROLLBACK_STATE_MISMATCH',
      detail: `current production ref is ${facts.currentRef ?? '(unsupported)'} but the receipt rolled forward to ${targetRef}; refusing to rollback from an unexpected state`,
      verdicts: {},
      exitCode: 3,
    })
  }
  if (service === undefined) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: 'SERVICE_NOT_HEALTHY',
      detail: 'web service must be healthy to rollback',
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }

  await writeTextAtomic(facts.packageJsonPath, preimagePackageJson)
  await appendStep({ receiptDir: rollbackReceiptDir, step: { step: 'ROLLBACK_PIN', outcome: 'DONE', restored: 'preimage package.json bytes' } })
  const install = await run('pnpm', ['install'], { cwd: facts.profileDir, timeoutMs: 600_000, env: process.env })
  await appendStep({ receiptDir: rollbackReceiptDir, step: { step: 'INSTALL', outcome: install.code === 0 ? 'DONE' : 'FAILED', exitCode: install.code } })
  if (install.code !== 0) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: 'INSTALL_FAILED',
      detail: `pnpm install failed during rollback (exit ${install.code})`,
      verdicts: preflight.verdicts,
      exitCode: 4,
    })
  }
  const postLockRaw = await readFile(facts.lockPath, 'utf8')
  const postSummary = summarizeLockfile(postLockRaw)
  const drift = postSummary.ok
    ? classifyLockDrift({ pre: facts.lockSummary, post: postSummary.summary, fromRef: targetRef, toRef: rollbackRef })
    : { ok: false, reason: 'LOCKFILE_UNPARSEABLE', drift: [], detail: postSummary.detail }
  if (!drift.ok && drift.reason === 'UNRELATED_DEPENDENCY_DRIFT') {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: 'UNRELATED_DEPENDENCY_DRIFT',
      detail: `unrelated drift during rollback install: ${drift.drift.join('; ')}`,
      verdicts: preflight.verdicts,
      exitCode: 3,
    })
  }
  if (!drift.ok) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: drift.reason ?? 'LOCKFILE_ERROR',
      detail: drift.detail ?? 'lockfile error during rollback',
      verdicts: preflight.verdicts,
      exitCode: 4,
    })
  }

  if (service === undefined) {
    return stopApply({ options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef, reason: 'SERVICE_NOT_HEALTHY', detail: 'unreachable', verdicts: preflight.verdicts, exitCode: 3 })
  }
  const restart = await controlledRestart({
    service,
    dshHome: preflight.dshHome,
    profile: options.profile,
    receiptDir: rollbackReceiptDir,
    environment: process.env,
  })
  if (!restart.ok) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: restart.reason,
      detail: restart.detail,
      verdicts: { ...preflight.verdicts, CONTROLLED_RESTART: { verdict: 'FAIL' } },
      exitCode: 4,
    })
  }
  const postFacts = await readProfileFacts(facts.profileDir)
  const proof = await runtimeProof({
    profileDir: facts.profileDir,
    repo: options.repo,
    ref: rollbackRef,
    lockRef: postFacts.ok ? lockfileVehiclePetRef(postFacts.facts.lockSummary) : undefined,
    port: restart.service.port,
  })
  await appendStep({
    receiptDir: rollbackReceiptDir,
    step: { step: 'RUNTIME_PROOF', outcome: proof.ok ? 'PASS' : 'FAILED', install: proof.install, content: proof.content, served: proof.served },
  })
  if (!proof.ok) {
    return stopApply({
      options, receiptDir: rollbackReceiptDir, targetRef: rollbackRef,
      reason: 'RUNTIME_PROOF_FAILED',
      detail: [proof.install.ok ? null : `INSTALL: ${proof.install.detail}`, proof.content.ok ? null : `CONTENT: ${proof.content.detail}`, proof.served.ok ? null : `SERVED: ${proof.served.detail}`].filter(Boolean).join(' | '),
      verdicts: { ...preflight.verdicts, RUNTIME_PROOF: { verdict: 'FAIL' } },
      exitCode: 4,
    })
  }

  const postState = options.skipStateProbe
    ? { status: 'UNAVAILABLE', targets: [], reason: 'state probe disabled by flag' }
    : await capturePetState({ cdpUrl: options.cdpUrl, originPatterns: preflight.originRegexps })
  // Preservation is checked against the apply receipt's postimage when present.
  const applyPostState = await readApplyPostState(receiptDir)
  const stateVerdicts = applyPostState !== undefined
    ? comparePetState({ pre: applyPostState, post: postState })
    : { STATE_PROBE: { verdict: /** @type {'UNAVAILABLE'} */ ('UNAVAILABLE'), detail: 'apply receipt has no postimage state; compare manually' } }
  await finalizeReceipt({
    receiptDir: rollbackReceiptDir,
    verdicts: { ...preflight.verdicts, RUNTIME_PROOF: { verdict: 'PASS' }, ...stateVerdicts },
    result: 'ROLLBACK_COMPLETE',
    exitCode: 0,
    finishedAt: new Date().toISOString(),
    note: `rolled back ${targetRef} → ${rollbackRef} (receipt ${receiptDir})`,
  })
  return emitResult({
    options,
    exitCode: 0,
    receiptDir: rollbackReceiptDir,
    summary: [
      `ROLLBACK          ${targetRef} → ${rollbackRef}`,
      `RUNTIME_PROOF     PASS`,
      `RESULT            ROLLBACK_COMPLETE`,
      `receipt           ${rollbackReceiptDir}`,
    ],
  })
}

/**
 * The read-only preflight stage shared by plan/apply/rollback.
 * @param {{targetRef: string, options: FlowOptions, mode: string}} input
 */
async function preflightStage(input) {
  const { targetRef, options, mode } = input
  const dshHome = resolveDshHome(options.dshHomeOverride)
  const profileDir = profileDirOf(dshHome, options.profile)
  /** @type {{rejected?: {reason: string, detail: string}, facts?: import('./dshfacts.mjs').ProfileFacts, receiptDir?: string, service?: (import('./service.mjs').ServiceFacts & {health?: unknown})|undefined, stateCapture?: {status: string, targets: unknown[]}, verdicts?: Record<string, unknown>, dshHome?: string, originRegexps?: RegExp[], receipt?: object}} */
  const stage = { verdicts: {} }

  await ensureReceiptRoot(options.outRoot)
  const { receiptDir, receiptId } = await createReceiptDir({ outRoot: options.outRoot, targetRef, mode })
  stage.receiptDir = receiptDir

  const gitTruth = await verifyRefFromOrigin({ repo: options.repo, ref: targetRef })
  if (!gitTruth.ok) {
    stage.rejected = { reason: gitTruth.reason, detail: gitTruth.detail }
    await finalizeReceipt({
      receiptDir, verdicts: {}, result: gitTruth.reason, exitCode: 2,
      finishedAt: new Date().toISOString(), note: gitTruth.detail,
    })
    stage.receipt = { receiptDir, receiptId }
    return stage
  }
  stage.dshHome = dshHome

  const factsResult = await readProfileFacts(profileDir)
  if (!factsResult.ok) {
    stage.rejected = { reason: factsResult.reason, detail: factsResult.detail }
    await finalizeReceipt({ receiptDir, verdicts: {}, result: factsResult.reason, exitCode: 2, finishedAt: new Date().toISOString(), note: factsResult.detail })
    return stage
  }
  const facts = factsResult.facts
  stage.facts = facts

  // service discovery + health (§6 fresh facts)
  const discovered = await discoverWebService({ dshHome, profile: options.profile, portHint: options.portHint })
  let serviceWithHealth
  let health
  if (discovered.ok) {
    health = await healthCheck(discovered.service.port)
    serviceWithHealth = { ...discovered.service, health }
    stage.service = serviceWithHealth
  } else {
    health = { status: undefined, ok: false, ms: 0, error: discovered.detail }
  }

  // state probe (pre) — plan mode tolerates unavailability
  const originRegexps = buildOriginRegexps(options.originPatterns)
  stage.originRegexps = originRegexps
  const stateCapture = options.skipStateProbe
    ? { status: 'UNAVAILABLE', targets: [], reason: 'state probe disabled by flag' }
    : await capturePetState({ cdpUrl: options.cdpUrl, originPatterns: originRegexps })
  stage.stateCapture = stateCapture

  const servedClient = await captureServedClientHash({ port: serviceWithHealth?.port ?? options.portHint ?? 0 })
  const tool = {
    version: TOOL_VERSION,
    nodeVersion: process.version,
    pnpmVersion: await pnpmVersion(),
  }
  const captured = await capturePreimage({
    receiptDir,
    receiptId,
    targetRef,
    facts,
    service: serviceWithHealth,
    dshHome,
    profile: options.profile,
    gitTruth: { method: gitTruth.method, originUrl: gitTruth.originUrl, ref: targetRef },
    stateCapture,
    servedClient,
    tool,
    mode,
  })
  stage.receiptDir = receiptDir
  stage.receipt = captured
  stage.verdicts = {
    GIT_TRUTH: { verdict: 'PASS', detail: `${gitTruth.method} from ${gitTruth.originUrl}` },
    CURRENT_REF_DISCOVERY: {
      verdict: facts.parsedSpec.kind === 'git-fixed-ref' ? 'PASS' : 'FAIL',
      detail: facts.parsedSpec.kind === 'git-fixed-ref' ? facts.currentRef : `unsupported spec: ${JSON.stringify(facts.spec)}`,
    },
    SERVICE_DISCOVERY: {
      verdict: serviceWithHealth !== undefined ? 'PASS' : 'FAIL',
      detail: serviceWithHealth !== undefined
        ? `pid ${serviceWithHealth.pid} port ${serviceWithHealth.port} (${serviceWithHealth.cmdline})`
        : discovered.detail,
    },
    WEB_HEALTH: { verdict: health !== undefined && health.ok ? 'PASS' : 'FAIL', detail: JSON.stringify(health) },
    OTHER_PLUGINS_PRESERVED: {
      verdict: 'PASS',
      detail: 'enforced by lock drift + membership gates during mutation; preimage resolutions recorded',
    },
    STATE_PROBE_PRE: {
      verdict: stateCapture.status === 'CAPTURED' ? 'PASS' : 'UNAVAILABLE',
      detail: stateCapture.status === 'CAPTURED'
        ? `${stateCapture.targets.length} matching browser target(s)`
        : /** @type {any} */ (stateCapture).reason,
    },
  }
  if (mode === 'apply' && serviceWithHealth === undefined) {
    // apply keeps this as a stop at the caller; keep verdicts recorded
  }
  return stage
}

/**
 * Decide the plan from fresh facts alone.
 * @param {{facts: import('./dshfacts.mjs').ProfileFacts, targetRef: string}} input
 */
function buildPlan(input) {
  const { facts, targetRef } = input
  if (facts.currentRef === undefined) {
    return {
      kind: 'BLOCKED',
      detail: 'current spec is not a git-fixed-ref — plan cannot derive the production ref (apply would stop CURRENT_SPEC_UNSUPPORTED)',
      verdicts: { PLAN: { verdict: 'FAIL', detail: 'CURRENT_SPEC_UNSUPPORTED' } },
    }
  }
  if (facts.currentRef === targetRef) {
    return {
      kind: 'NO_OP_ALREADY_AT_TARGET',
      detail: `production is already at ${targetRef}; nothing to do`,
      verdicts: { NO_OP: { verdict: 'PASS', detail: 'CURRENT_REF == TARGET_REF' } },
    }
  }
  return {
    kind: 'UPGRADE',
    detail: `planned mutation: pin ${VEHICLE_PET_PACKAGE} ${facts.currentRef} → ${targetRef}, pnpm install, drift gates, controlled web restart, runtime proof, state postflight`,
    verdicts: { PLAN: { verdict: 'PASS', detail: `upgrade ${facts.currentRef} → ${targetRef}` } },
  }
}

/**
 * Revert the profile to the exact preimage bytes and reinstall the preimage
 * lock (lockfile-faithful), used when a post-install gate fails.
 * @param {{facts: import('./dshfacts.mjs').ProfileFacts, receiptDir: string}} input
 */
async function revertToPreimage(input) {
  const { facts, receiptDir } = input
  try {
    const preimagePackageJson = await readFile(join(receiptDir, 'preimage', 'package.json'), 'utf8')
    const preimageLock = await readFile(join(receiptDir, 'preimage', 'pnpm-lock.yaml'), 'utf8')
    await writeFile(facts.packageJsonPath, preimagePackageJson, 'utf8')
    await writeFile(facts.lockPath, preimageLock, 'utf8')
    const reinstall = await run('pnpm', ['install'], { cwd: facts.profileDir, timeoutMs: 600_000, env: process.env })
    if (reinstall.code !== 0) {
      return { ok: false, detail: `reinstall after revert failed (exit ${reinstall.code})` }
    }
    const revertedLock = await readFile(facts.lockPath, 'utf8')
    if (sha256Hex(revertedLock) !== sha256Hex(preimageLock)) {
      return { ok: false, detail: 'lockfile differs from preimage after revert reinstall' }
    }
    await appendStep({ receiptDir, step: { step: 'REVERT_TO_PREIMAGE', outcome: 'DONE' } })
    return { ok: true, detail: 'reverted' }
  } catch (error) {
    return { ok: false, detail: String(error) }
  }
}

/** @param {string} receiptDir */
async function readApplyPostState(receiptDir) {
  try {
    const raw = await readFile(join(receiptDir, 'postimage', 'state.json'), 'utf8')
    return JSON.parse(raw).stateCapture
  } catch {
    return undefined
  }
}

/** @param {string[]} patterns */
function buildOriginRegexps(patterns) {
  const list = patterns.length > 0 ? patterns : [`http://127\\.0\\.0\\.1:\\d+`, `http://localhost:\\d+`]
  return list.map(pattern => new RegExp(pattern))
}

/** Read the receipt.json of a run (for the CLI's --json output). */
async function readReceipt(receiptDir) {
  try {
    return JSON.parse(await readFile(join(receiptDir, 'receipt.json'), 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * Uniform rejection report (exit 2): nothing was mutated.
 * @param {{options: FlowOptions, reason: string, detail: string, targetRef: string|null, receiptDir?: string}} input
 */
async function reportReject(input) {
  const { options, reason, detail, targetRef, receiptDir } = input
  emitSummary(options, [
    `TARGET_REF   ${targetRef ?? '(invalid)'}`,
    `RESULT       REJECT_BEFORE_MUTATION`,
    `REASON       ${reason}`,
    `DETAIL       ${detail}`,
  ])
  return { exitCode: 2, receipt: receiptDir !== undefined ? await readReceipt(receiptDir) : undefined }
}

/**
 * Uniform stop report (exit 3/4): mutation may have partially happened;
 * receipt carries the exact state and the revert outcome.
 * @param {{options: FlowOptions, receiptDir: string, targetRef: string, reason: string, detail: string, verdicts: Record<string, unknown>, exitCode: number}} input
 */
async function stopApply(input) {
  const { options, receiptDir, targetRef, reason, detail, verdicts, exitCode } = input
  await finalizeReceipt({
    receiptDir,
    verdicts,
    result: reason,
    exitCode,
    finishedAt: new Date().toISOString(),
    note: detail,
  })
  emitSummary(options, [
    `TARGET_REF   ${targetRef}`,
    `RESULT       ${reason}`,
    `DETAIL       ${detail}`,
    `receipt      ${receiptDir}`,
  ])
  return { exitCode, receiptDir, receipt: await readReceipt(receiptDir) }
}

/** @param {{options: FlowOptions, exitCode: number, summary: string[], receiptDir?: string}} input */
async function emitResult(input) {
  emitSummary(input.options, input.summary)
  return {
    exitCode: input.exitCode,
    receipt: input.receiptDir !== undefined ? await readReceipt(input.receiptDir) : undefined,
  }
}

/** @param {FlowOptions} options @param {string[]} lines */
function emitSummary(options, lines) {
  if (options.json) return
  for (const line of lines) console.log(line)
}
