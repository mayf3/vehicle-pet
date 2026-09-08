/**
 * DSH coexistence E2E web-server launcher: prepares a SEPARATE disposable
 * acceptance home with BOTH overlay plugins installed — the local
 * @mayf3/vehicle-pet build and the coexistence reference deepseek-pet whale
 * (github:keleus/deepseek-pet, the same origin production installs from) —
 * and boots the pinned Harness Web against them. The home is recreated from
 * scratch every run and never touches the user's real profile.
 */

import { rm, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'

const DSH_ROOT = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const DSH_HOME = process.env.DISPOSABLE_DSH_COEXIST_HOME ?? '/tmp/vehicle-pet-overlay-dsh-coexist-home'
const PLUGIN_ROOT = process.env.VEHICLE_PET_PLUGIN_ROOT ?? process.cwd()
const WHALE_SPEC = process.env.VEHICLE_PET_WHALE_SPEC ?? 'github:keleus/deepseek-pet'
const PORT = process.env.VEHICLE_PET_DSH_COEXIST_PORT ?? '3085'
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
  '# Disposable coexistence acceptance home — recreated by every Playwright run.',
  'llm-deepseek:',
  `  baseURL: http://127.0.0.1:${MOCK_LLM_PORT}/v1`,
  '  apiKeyEnv: VEHICLE_PET_MOCK_LLM_KEY',
  '',
].join('\n'))
await writeFile(path.join(DSH_HOME, 'cordis.patch.yml'), [
  '# Disposable acceptance home — auxiliary title-llm disabled so only the',
  '# scripted session turns reach the mock LLM.',
  '- replace:',
  '    - id: session-title-llm',
  '      disabled: true',
  '',
].join('\n'))

const add = spec => execFileSync('pnpm', ['dsh', 'plugin', '--profile', 'web', 'add', spec], {
  cwd: DSH_ROOT,
  encoding: 'utf8',
  env: { ...process.env, DSH_HOME },
  stdio: ['ignore', 'pipe', 'pipe'],
})
console.log('[dsh-coexistence] vehicle-pet add done:\n' + add(PLUGIN_ROOT).split('\n').slice(-4).join('\n'))
console.log('[dsh-coexistence] whale add done:\n' + add(WHALE_SPEC).split('\n').slice(-4).join('\n'))

const child = spawn('pnpm', ['dsh', 'web', '--no-open', '--port', PORT], {
  cwd: DSH_ROOT,
  env: {
    ...process.env,
    DSH_HOME,
    DSH_PERMISSION_MODE: 'read-only',
    VEHICLE_PET_MOCK_LLM_KEY: 'mock-key',
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
