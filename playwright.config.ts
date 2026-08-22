import { defineConfig } from '@playwright/test'

// Uses the locally installed Google Chrome via CDP channel to avoid a separate
// browser download; Playwright always launches it with an isolated profile.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    channel: 'chrome',
    headless: true,
    baseURL: 'http://localhost:5199',
    screenshot: 'off',
    trace: 'off',
  },
  webServer: {
    command: 'pnpm dev -- --port 5199',
    url: 'http://localhost:5199',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  outputDir: 'test-results',
})
