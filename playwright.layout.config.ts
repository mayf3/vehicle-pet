import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/dsh/layout',
  workers: 1,
  retries: 0,
  use: { channel: 'chrome', headless: true, viewport: { width: 1280, height: 720 } },
  outputDir: 'test-results-dsh/layout',
})
