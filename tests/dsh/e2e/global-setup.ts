/**
 * DSH overlay E2E global setup: prepares the disposable acceptance
 * environment (CTR-OVERLAY-012, ACC-OVERLAY-013).
 *
 * - refuses to touch the user's real DSH home (the disposable home is
 *   recreated under /tmp from scratch every run);
 * - asserts the pinned DSH worktree is installed and built;
 * - installs the local plugin through the documented
 *   `dsh plugin --profile web add <local checkout>` path (pnpm delegates,
 *   no allowBuilds needed for a local checkout with committed artifacts);
 * - writes the disposable settings.yaml pointing the DeepSeek adapter at the
 *   local mock LLM, so browser-driven turns produce real structured states.
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'

const DSH_ROOT = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const DSH_HOME = process.env.DISPOSABLE_DSH_HOME ?? '/tmp/vehicle-pet-overlay-dsh-home-r1'
const PLUGIN_ROOT = process.env.VEHICLE_PET_PLUGIN_ROOT
  ?? '/Users/yanfenma/workspace/project/vehicle-pet-wt-overlay-v1-5b9c6fa6'
const MOCK_LLM_PORT = process.env.VEHICLE_PET_MOCK_LLM_PORT ?? '8901'

export default async function globalSetup(): Promise<() => Promise<void>> {
  // Home preparation and plugin install live in launch-dsh-web.mjs (the
  // webServer process) because Playwright starts webServer and globalSetup
  // concurrently; this setup only asserts readiness and starts the mock LLM.
  if (!DSH_HOME.startsWith('/tmp/')) {
    throw new Error(`refusing to use non-disposable DSH_HOME: ${DSH_HOME}`)
  }
  for (const marker of ['node_modules', 'apps/web/dist']) {
    if (!existsSync(path.join(DSH_ROOT, marker))) {
      throw new Error(`pinned DSH worktree is not ready (missing ${marker}); run pnpm install && pnpm run build there first`)
    }
  }
  if (!existsSync(path.join(PLUGIN_ROOT, 'lib/client.js'))) {
    throw new Error('plugin artifacts missing; run pnpm build:dsh in the implementation worktree first')
  }

  // Scriptable mock LLM (pinned dsh-llm-mock-server): real browser-driven
  // turns produce real structured session states. One behavior per request:
  // slow_success (running+completed), tool_call_success (approval =
  // needs-input), server_error (failed; the post-tool follow-up), stall
  // (cancelled via Stop), then success for the remaining turns.
  // Sequence budget (one behavior per chat-completions request):
  //   #1 slow_success  — the first-prompt title-llm request (if fired)
  //   #2 slow_success  — turn 1: streaming success (running -> completed)
  //   #3 tool_call_success (ask_user_question) — turn 2: pending question
  //       (needs-input); answering continues the turn into
  //   #4 invalid_request — turn 2 ends failed immediately (not retryable,
  //       unlike server_error which the llm-retry plugin would re-consume)
  //   #5 stall         — turn 3: running until Stop (cancelled)
  //   #6+ success      — later turns (repeat-last)
  const mockLog = createWriteStream('/tmp/vehicle-pet-dsh-mock.log', { flags: 'w' })
  const mock = spawn('node', [
    '--import', 'tsx/esm',
    'packages/test-support/llm-mock-server/src/bin.ts',
    '--sequence', 'slow_success,slow_success,tool_call_success,invalid_request,stall,success',
    '--repeat-last',
    '--chunk-delay-ms', '400',
    '--port', MOCK_LLM_PORT,
    // Turn 2's scripted tool call is ask_user_question: the pending
    // question is the structured needs-input state; answering it lets the
    // turn continue into the scripted server_error (failed reaction).
    '--tool-name', 'ask_user_question',
    '--tool-arguments', JSON.stringify({
      questions: [{
        id: 'e2e-continue',
        question: 'Continue the e2e flow?',
        options: [{ label: 'Yes, continue' }, { label: 'Stop here' }],
      }],
    }),
  ], { cwd: DSH_ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  mock.stdout!.pipe(mockLog)
  mock.stderr!.pipe(mockLog)
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('mock LLM did not report ready')), 30_000)
    mock.stdout!.on('data', chunk => {
      if (String(chunk).includes('"type":"ready"')) {
        clearTimeout(timer)
        resolve()
      }
    })
    mock.on('exit', code => reject(new Error(`mock LLM exited early with ${code}`)))
  })
  console.log(`[dsh-e2e setup] mock LLM ready on 127.0.0.1:${MOCK_LLM_PORT}`)

  return async () => {
    mock.kill('SIGTERM')
  }
}
