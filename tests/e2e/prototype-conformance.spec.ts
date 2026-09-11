import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') await route.continue()
    else await route.abort('blockedbyclient')
  })
})

test('normal autonomous-fleet growth and one merged ceremony', async ({ page }) => {
  await page.goto('/?dev=1&pack=autonomous-fleet&points=0')
  await expect(page.locator('[data-pet-subject="true"]')).toBeVisible()
  await page.locator('#exact-points').fill('1200000')
  await page.getByRole('button', { name: '应用' }).click()
  await expect(page.getByText(/10\. 万车多城/)).toBeVisible()
  const ceremony = page.locator('[data-pet-ceremony="true"]')
  await expect(ceremony).toBeVisible()
  expect(Number(await ceremony.getAttribute('data-beats'))).toBeLessThanOrEqual(3)
  expect(Number(await ceremony.getAttribute('data-total-ms'))).toBeLessThanOrEqual(3000)
  await ceremony.locator('[data-pet-ceremony-skip="true"]').click()
  await expect(ceremony).toHaveCount(0)
})

test('seedling grows through the same page and renderer', async ({ page }) => {
  await page.goto('/?dev=1&pack=seedling-fixture&points=60000')
  await expect(page.locator('[data-pet-pack-option="seedling-fixture"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('3. 小树')).toBeVisible()
  await expect(page.locator('[data-pet-subject="true"]')).toHaveAccessibleName(/小树伙伴/)
  await page.locator('#exact-points').fill('300000')
  await page.getByRole('button', { name: '应用' }).click()
  await expect(page.getByText('4. 森林')).toBeVisible()
  await expect(page.getByText('1000 棵树')).toBeVisible()
})

test('pack switch is silent and preserves progress', async ({ page }) => {
  await page.goto('/?dev=1&pack=autonomous-fleet&points=60000')
  await expect(page.getByText(/4\./)).toBeVisible()
  await page.locator('[data-pet-pack-option="seedling-fixture"]').click()
  await expect(page.getByText('3. 小树')).toBeVisible()
  await expect(page.locator('[data-pet-ceremony="true"]')).toHaveCount(0)
  await page.locator('[data-pet-pack-option="autonomous-fleet"]').click()
  await expect(page.getByText(/4\./)).toBeVisible()
  await expect(page.locator('[data-pet-ceremony="true"]')).toHaveCount(0)
})

test('reduced motion retains final structure and static ceremony', async ({ page }) => {
  await page.goto('/?dev=1&pack=autonomous-fleet&points=1800000&reducedMotion=1')
  await expect(page.locator('[data-reduced-motion="on"]')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('#exact-points').fill('2500000')
  await page.getByRole('button', { name: '应用' }).click()
  await expect(page.locator('[data-pet-ceremony-reduced="true"]')).toBeVisible()
  await expect(page.getByText(/12\./)).toBeVisible()
})

test('Host completed failed and cancelled feedback are distinct', async ({ page }) => {
  await page.goto('/?dev=1')
  for (const [selector, status] of [
    ['[data-host-completed="true"]', 'completed'],
    ['[data-host-failed="true"]', 'failed'],
    ['[data-host-cancelled="true"]', 'cancelled'],
  ] as const) {
    await page.locator(selector).click()
    await expect(page.locator(`[data-pet-host-feedback="${status}"]`)).toBeVisible()
  }
})

test('asset fallback keeps progress milestone and accessible subject', async ({ page }) => {
  await page.goto('/?dev=1&pack=autonomous-fleet&points=300000')
  await page.locator('[data-fail-asset="true"]').click()
  await expect(page.locator('[data-pet-subject="true"]')).toBeVisible()
  await expect(page.getByText(/7\./)).toBeVisible()
  await expect(page.locator('[role="progressbar"]')).toBeVisible()
  await expect(page.locator('[data-pet-milestone="true"]')).toBeVisible()
})

test('max level has capped state and no fabricated next target', async ({ page }) => {
  await page.goto('/?dev=1&pack=autonomous-fleet&points=9007199254740991')
  await expect(page.locator('[data-pet-capped="true"]')).toBeVisible()
  await expect(page.getByText(/12\./)).toBeVisible()
})

test('showcase contains required fleet, seedling, and orb states', async ({ page }) => {
  await page.goto('/?showcase=1')
  await expect(page.locator('[data-pet-showcase="true"]')).toBeVisible()
  // The showcase is a generic grid over every discovered bundled Pack:
  // fleet 12 levels + seedling 4 + orb fixture 4 = 16 figures (V8 DEC-028).
  await expect(page.locator('figure')).toHaveCount(16)
  await expect(page.getByText(/autonomous-fleet · 12\/12/)).toBeVisible()
  await expect(page.getByText(/seedling-fixture · 4\/4/)).toBeVisible()
  await expect(page.getByText(/orb-fixture · 4\/4/)).toBeVisible()
})
