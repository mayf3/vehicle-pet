/**
 * Playwright config for the DSH overlay browser acceptance run
 * (ACC-OVERLAY-002..017) against the pinned DeepSeek Harness Web.
 *
 * Environment contract (all fixed):
 * - DSH_REFERENCE_WORKTREE: the pinned f77b5a2f checkout, installed and built.
 * - DISPOSABLE_DSH_HOME: a throwaway DSH home (never the user's real profile).
 * - The local @mayf3/vehicle-pet plugin is installed into profile `web`
 *   by the global setup through the documented `dsh plugin add` path.
 * - A scriptable mock LLM (pinned dsh-llm-mock-server) drives real session
 *   states: running, needs-input (tool approval), completed, failed,
 *   cancelled (stall + stop).
 * - Production operation requires no `pnpm dev` and no port 5199.
 */

import { defineConfig } from '@playwright/test'

const DSH_ROOT = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const DSH_HOME = process.env.DISPOSABLE_DSH_HOME ?? '/tmp/vehicle-pet-overlay-dsh-home-r1'
const WEB_PORT = Number(process.env.VEHICLE_PET_DSH_WEB_PORT ?? 3081)
const MOCK_LLM_PORT = 8901

export default defineConfig({
  testDir: 'tests/dsh/e2e',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    headless: true,
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  globalSetup: './tests/dsh/e2e/global-setup.ts',
  webServer: [
    {
      command: 'node tests/dsh/e2e/launch-dsh-web.mjs',
      cwd: process.cwd(),
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
  outputDir: 'test-results-dsh',
})
