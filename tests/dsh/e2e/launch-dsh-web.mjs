/**
 * DSH overlay E2E web-server launcher: prepares the disposable acceptance
 * home (recreated from scratch every run) and then boots the pinned Harness
 * Web profile with the local plugin installed (CTR-OVERLAY-012,
 * ACC-OVERLAY-013). Sequencing lives in this one process on purpose:
 * Playwright starts webServer and globalSetup concurrently, so the home must
 * be prepared by the server process itself before `dsh web` runs.
 */

import { rm, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'

const DSH_ROOT = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const DSH_HOME = process.env.DISPOSABLE_DSH_HOME ?? '/tmp/vehicle-pet-overlay-dsh-home-r1'
// VEHICLE_PET_PLUGIN_ROOT MUST point at the checked-out implementation
// worktree whose lib/client.js should be exercised (the artifact is validated
// below); there is no cross-worktree default on purpose.
const PLUGIN_ROOT = process.env.VEHICLE_PET_PLUGIN_ROOT
  ?? process.cwd()
const PORT = process.env.VEHICLE_PET_DSH_WEB_PORT ?? '3081'
const MOCK_LLM_PORT = process.env.VEHICLE_PET_MOCK_LLM_PORT ?? '8901'

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

await rm(DSH_HOME, { recursive: true, force: true })
await mkdir(DSH_HOME, { recursive: true })
await writeFile(path.join(DSH_HOME, 'settings.yaml'), [
  '# Disposable acceptance home — recreated by every Playwright run.',
  'llm-deepseek:',
  `  baseURL: http://127.0.0.1:${MOCK_LLM_PORT}/v1`,
  '  apiKeyEnv: VEHICLE_PET_MOCK_LLM_KEY',
  '',
].join('\n'))
// Keep the scripted mock's behavior ordering deterministic: the first-prompt
// title generator is an auxiliary chat-completions consumer that would
// otherwise consume script slots. Disabled through the documented home-level
// user patch layer (disposable home only, no DSH Core change).
await writeFile(path.join(DSH_HOME, 'cordis.patch.yml'), [
  '# Disposable acceptance home — auxiliary title-llm disabled so only the',
  '# scripted session turns reach the mock LLM.',
  '- replace:',
  '    - id: session-title-llm',
  '      disabled: true',
  '',
].join('\n'))

const transcript = execFileSync('pnpm', ['dsh', 'plugin', '--profile', 'web', 'add', PLUGIN_ROOT], {
  cwd: DSH_ROOT,
  encoding: 'utf8',
  env: { ...process.env, DSH_HOME },
  stdio: ['ignore', 'pipe', 'pipe'],
})
console.log('[dsh-e2e launcher] plugin add done:\n' + transcript.split('\n').slice(-4).join('\n'))

const child = spawn('pnpm', ['dsh', 'web', '--no-open', '--port', PORT], {
  cwd: DSH_ROOT,
  env: {
    ...process.env,
    DSH_HOME,
    DSH_PERMISSION_MODE: 'read-only',
    VEHICLE_PET_MOCK_LLM_KEY: 'mock-key',
    // The directory-picker resolver treats an SSH launch as remote-operator
    // and mounts the in-GUI browse picker instead of the native OS dialog,
    // which a headless browser cannot open. Disposable acceptance env only.
    SSH_CONNECTION: '127.0.0.1 51999 127.0.0.1 22',
  },
  stdio: 'inherit',
})
const forward = signal => {
  child.kill(signal)
}
process.on('SIGTERM', () => forward('SIGTERM'))
process.on('SIGINT', () => forward('SIGINT'))
child.on('exit', code => {
  process.exit(code ?? 0)
})
