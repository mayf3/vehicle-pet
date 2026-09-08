#!/usr/bin/env node
/**
 * vehicle-pet-release — repository-local fixed-ref production release helper
 * for the DSH Vehicle Pet web profile (Goal 发布).
 *
 *   vehicle-pet-release <TARGET_40HEX>                    preflight/plan, READ-ONLY
 *   vehicle-pet-release <TARGET_40HEX> --apply            the only mutating mode
 *   vehicle-pet-release rollback --receipt <dir>          back to the receipt's preimage ref
 *   vehicle-pet-release evidence --src <path> [—-src ...] --dest docs/evidence/... --message <msg>
 *
 * The target must be an exact 40-hex commit SHA; main/branch/tag/short-SHA
 * are rejected before anything runs. Default mode never writes outside its
 * receipt directory. See docs/runbooks/VEHICLE_PET_PRODUCTION_RELEASE_R1.md.
 * @module scripts/release/vehicle-pet-release
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { runPlan, runApply, runRollback } from './lib/flow.mjs'
import { createEvidenceBranch } from './lib/evidence.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const USAGE = `usage:
  vehicle-pet-release <TARGET_40HEX> [options]          preflight/plan (READ-ONLY, default)
  vehicle-pet-release <TARGET_40HEX> --apply [options]  execute the production upgrade
  vehicle-pet-release rollback --receipt <dir> [options] rollback to the receipt's preimage ref
  vehicle-pet-release evidence --src <path> [--src <path>...] --dest docs/evidence/<name>
                        --message <msg> [--repo <path>]  docs-only evidence branch from fresh origin/main

options:
  --apply                execute mutation (default: read-only plan)
  --json                 machine-readable receipt on stdout
  --out <dir>            receipt root (default: ${resolve(repo, 'vehicle-pet-release-receipts')})
  --dsh-home <dir>       DSH home (default: $DSH_HOME else ~/.dsh)
  --profile <name>       DSH profile (default: web)
  --port <n>             web port hint for service discovery (default: auto-detect)
  --vehicle-pet-repo <path>  git-truth repository (default: the repository containing this tool)
  --cdp-url <url>        browser CDP endpoint for the state probe (default: http://127.0.0.1:9222)
  --web-origin <pattern> extra origin regex for browser-target matching (repeatable)
  --allow-missing-state-probe  apply-only: accept an unverifiable state postflight (discouraged)
  --skip-state-probe     plan/E2E-only: skip the browser state probe entirely
`

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string|boolean|string[]>} */
  const values = {}
  /** @type {string[]} */
  const positional = []
  /** @type {string[]} */
  const webOrigins = []
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? ''
    if (token === '--web-origin') {
      webOrigins.push(argv[index + 1] ?? '')
      index += 1
      continue
    }
    if (token.startsWith('--')) {
      const key = token.slice(2)
      const next = argv[index + 1]
      if (next !== undefined && !next.startsWith('--')) {
        if (key === 'src') {
          const list = /** @type {string[]} */ (values.src ?? [])
          list.push(next)
          values.src = list
        } else {
          values[key] = next
        }
        index += 1
      } else {
        values[key] = true
      }
      continue
    }
    positional.push(token)
  }
  values['web-origin-list'] = webOrigins
  return { values, positional }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(USAGE)
    process.exit(0)
  }
  const { values: args, positional } = parseArgs(argv)
  const options = {
    repo: typeof args['vehicle-pet-repo'] === 'string' ? /** @type {string} */ (args['vehicle-pet-repo']) : repo,
    dshHomeOverride: typeof args['dsh-home'] === 'string' ? /** @type {string} */ (args['dsh-home']) : undefined,
    profile: typeof args.profile === 'string' ? /** @type {string} */ (args.profile) : 'web',
    portHint: typeof args.port === 'string' ? Number(args.port) : undefined,
    cdpUrl: typeof args['cdp-url'] === 'string' ? /** @type {string} */ (args['cdp-url']) : 'http://127.0.0.1:9222',
    originPatterns: /** @type {string[]} */ (args['web-origin-list'] ?? []),
    outRoot: typeof args.out === 'string' ? /** @type {string} */ (args.out) : resolve(repo, 'vehicle-pet-release-receipts'),
    allowMissingStateProbe: args['allow-missing-state-probe'] === true,
    skipStateProbe: args['skip-state-probe'] === true,
    json: args.json === true,
  }
  if (Number.isNaN(options.portHint)) {
    console.error('invalid --port value')
    process.exit(2)
  }

  const command = positional[0]
  if (command === 'evidence') {
    const sources = /** @type {string[]} */ (args.src ?? [])
    const dest = typeof args.dest === 'string' ? /** @type {string} */ (args.dest) : ''
    const message = typeof args.message === 'string' ? /** @type {string} */ (args.message) : ''
    if (dest === '' || message === '') {
      process.stdout.write('evidence requires --dest docs/evidence/<name> and --message\n')
      process.exit(2)
    }
    const result = await createEvidenceBranch({ sources, dest, message, repo: options.repo })
    if (!result.ok) {
      console.error(`EVIDENCE_FAILED ${result.reason}: ${result.detail}`)
      process.exit(4)
    }
    console.log([
      `EVIDENCE_BRANCH  ${result.branch}`,
      `BASE (origin/main) ${result.base}`,
      `HEAD             ${result.head}`,
      `WORKTREE         ${result.worktree}`,
      `FILES            ${result.files.join(', ')}`,
      'NOT pushed — review, then push and open a docs-only PR.',
    ].join('\n'))
    process.exit(0)
  }

  if (command === 'rollback') {
    const receipt = typeof args.receipt === 'string' ? /** @type {string} */ (args.receipt) : ''
    if (receipt === '') {
      process.stdout.write('rollback requires --receipt <apply receipt dir>\n')
      process.exit(2)
    }
    const result = await runRollback({ receiptPath: receipt, options })
    emitTail(options, result)
    process.exit(result.exitCode)
  }

  // Default command: plan or apply against the exact target ref.
  const targetInput = command
  if (targetInput === 'plan' || targetInput === 'apply') {
    process.stdout.write(USAGE)
    process.exit(2)
  }
  const result = args.apply === true
    ? await runApply({ targetInput, options })
    : await runPlan({ targetInput, options })
  emitTail(options, result)
  process.exit(result.exitCode)
}

/** @param {object} options @param {{exitCode: number, receipt?: object}} result */
function emitTail(options, result) {
  if (options.json && result.receipt !== undefined) {
    process.stdout.write(`${JSON.stringify(result.receipt, null, 2)}\n`)
  }
}

main().catch(error => {
  console.error(`vehicle-pet-release internal error: ${error?.stack ?? error}`)
  process.exit(70)
})
