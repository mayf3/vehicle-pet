import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') await route.continue()
    else await route.abort('blockedbyclient')
  })
})

test('X01: default route is the clean product Pet surface', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Vehicle Pet', exact: true })).toBeVisible()
  await expect(page.locator('[data-pet-subject="true"]')).toBeVisible()
  await expect(page.locator('[data-prototype-controls="true"]')).toHaveCount(0)
  await expect(page.locator('[data-diagnostics="true"]')).toHaveCount(0)

  const body = await page.locator('body').innerText()
  for (const forbidden of [
    'Engine V1 Prototype',
    'MockProgressSource',
    '注入非法',
    '引擎诊断',
    'Journal / Keepsake',
    '重置本地演示数据',
    'pack-unavailable',
  ]) {
    expect(body, `default product route leaked: ${forbidden}`).not.toContain(forbidden)
  }
})

test('X01: development and showcase surfaces remain explicitly addressable', async ({ page }) => {
  await page.goto('/?dev=1')
  await expect(page.locator('[data-prototype-controls="true"]')).toBeVisible()
  await expect(page.locator('[data-diagnostics="true"]')).toBeVisible()
  await expect(page.getByRole('button', { name: '注入非法负数快照' })).toBeVisible()

  await page.goto('/?showcase=1')
  await expect(page.locator('[data-pet-showcase="true"]')).toBeVisible()
  await expect(page.locator('[data-prototype-controls="true"]')).toHaveCount(0)
})

test('X02: frozen Fleet L1-L4 states have four visibly distinct Pack sprites', async ({ page }) => {
  await page.goto('/?showcase=1')

  const captures: Buffer[] = []
  const stageAssets = [
    ['l1', 'sprite-subject-pod--l1'],
    ['l2', 'sprite-subject-pod--l2'],
    ['l3', 'sprite-subject-pod--l3'],
    ['l4', 'sprite-subject-pod--l4'],
  ] as const
  for (const [levelId, assetId] of stageAssets) {
    const cell = page.locator(`[data-showcase-pack="autonomous-fleet"][data-showcase-level="${levelId}"]`)
    await expect(cell).toHaveAttribute('data-showcase-scene', 'road-test')
    await expect(cell.locator(`img[src*="${assetId}.webp"]`)).toBeVisible()
    captures.push(await cell.locator('div').first().screenshot())
  }

  for (let i = 0; i < captures.length; i++) {
    for (let j = i + 1; j < captures.length; j++) {
      expect(captures[i]!.equals(captures[j]!), `L${i + 1} and L${j + 1} rendered identically`).toBe(false)
    }
  }
})
