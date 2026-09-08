/**
 * Playwright config for the DEEPSEEK_PET_COEXISTENCE acceptance run: the
 * pinned DeepSeek Harness Web in a SEPARATE disposable home with BOTH the
 * @mayf3/vehicle-pet plugin and the deepseek-pet whale (the production
 * coexistence reference) installed. Never parallel with the main DSH suite
 * (same mock LLM ports); run via `pnpm test:dsh:e2e:coexistence`.
 */

import { defineConfig } from '@playwright/test'

const WEB_PORT = Number(process.env.VEHICLE_PET_DSH_COEXIST_PORT ?? 3085)

export default defineConfig({
  testDir: 'tests/dsh/e2e',
  testMatch: /coexistence\.spec\.ts$/,
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
      command: 'node tests/dsh/e2e/launch-dsh-coexistence-web.mjs',
      cwd: process.cwd(),
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
  outputDir: 'test-results-dsh-coexistence',
})
