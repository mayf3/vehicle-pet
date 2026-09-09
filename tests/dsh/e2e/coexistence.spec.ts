/**
 * DEEPSEEK_PET_COEXISTENCE acceptance: the resident vehicle pet and the
 * co-installed deepseek-pet whale share one pinned Harness Web viewport in a
 * disposable home (CTR-OVERLAY-003 coexistence clause and the recorded
 * census footprint behind OVERLAY_GEOMETRY.largeDefaultBottomSafeInsetPx).
 *
 * Requires the whale plugin installable from its production origin
 * (github:keleus/deepseek-pet) — the launcher installs it into the same
 * disposable home as the local vehicle-pet build. The user's real DSH
 * profile is never touched.
 */

import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const WHALE = 'aside[data-dsh-live2d-root]'
const PET = '[data-vehicle-pet-pet="true"]'
const SHELL = '.vpo-shell'
const ROOT = '.vpo-root'
const VIEWPORT = { width: 1440, height: 900 } as const
const ARTIFACTS = 'tests/dsh/e2e/.artifacts'

const consoleErrors: string[] = []

test.beforeEach(async ({ page }) => {
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => {
    consoleErrors.push(error.message)
  })
})

async function dismissStartupDialogs(page: Page): Promise<void> {
  for (let round = 0; round < 6; round += 1) {
    const beta = page.getByRole('dialog', { name: /内测声明|Internal Testing Notice/ })
    await beta.waitFor({ timeout: round === 0 ? 5_000 : 1_000 }).catch(() => {})
    if (await beta.count() > 0) {
      await beta.getByRole('button', { name: /继续|Continue/ }).click()
      await page.waitForTimeout(500)
      await expect.poll(() => beta.count(), { timeout: 5_000 }).toBe(0).catch(() => {})
      continue
    }
    const keyDialog = page.getByRole('dialog', { name: /添加一个 API Key|Add an API key/ })
    await keyDialog.waitFor({ timeout: 3_000 }).catch(() => {})
    if (await keyDialog.count() > 0) {
      await keyDialog.getByRole('button', { name: /稍后配置|Configure later/ }).click()
      await page.waitForTimeout(500)
      await expect.poll(() => keyDialog.count(), { timeout: 5_000 }).toBe(0).catch(() => {})
      continue
    }
    break
  }
  await expect.poll(() => page.locator('[class*="mask"]').count(), { timeout: 5_000 }).toBe(0).catch(() => {})
}

async function connectWorkspaceAndSendPrompt(page: Page): Promise<void> {
  const workspace = '/tmp/vehicle-pet-coexistence-workspace'
  mkdirSync(workspace, { recursive: true })
  await dismissStartupDialogs(page)
  const picker = page.getByRole('textbox', { name: /Choose workspace|选择工作区/ })
  if (await picker.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await picker.click()
    const dialog = page.getByRole('dialog', { name: /Select Workspace Directory|选择工作区目录/ })
    await dialog.waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /Edit path|编辑路径/ }).click()
    const pathInput = dialog.getByRole('textbox', { name: /Edit path|编辑路径/ })
    await pathInput.fill(workspace)
    await pathInput.press('Enter')
    await dialog.getByRole('button', { name: /^(Open|打开)$/ }).click()
  }
  const composer = page.locator('textarea:enabled').last()
  await composer.waitFor({ timeout: 20_000 })
  await expect(composer).toBeEditable()
  await composer.fill(`coexistence-bootstrap-${Date.now()}`)
  const send = page.getByRole('button', { name: /发送消息|Send message/ }).first()
  await expect(send).toBeEnabled({ timeout: 20_000 })
  await send.click()
  await expect(composer).toHaveValue('', { timeout: 20_000 })
}

function overlapArea(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

test('DEEPSEEK_PET_COEXISTENCE_TEST. both pets share the viewport and the LARGE default clears the whale footprint', async ({ page }) => {
  await page.goto('/')
  await connectWorkspaceAndSendPrompt(page)

  // Both surfaces mount in the same viewport: the whale aside and the vehicle
  // pet resident (onboarding ends with the first accepted prompt).
  const whale = page.locator(WHALE)
  await expect.poll(() => whale.count(), { timeout: 30_000 }).toBe(1)
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'large')

  await page.waitForTimeout(1500) // let both surfaces settle their entrances
  const whaleBox = await whale.boundingBox()
  const petBox = await page.locator(SHELL).boundingBox()
  expect(whaleBox).not.toBeNull()
  expect(petBox).not.toBeNull()

  // The whale keeps its recorded default bottom-right footprint class
  // (census ≈ 306x372 anchored bottom-right); a radical resize would mean the
  // recorded constant behind the LARGE safe inset no longer describes reality.
  expect(whaleBox!.width).toBeGreaterThanOrEqual(240)
  expect(whaleBox!.width).toBeLessThanOrEqual(400)
  expect(whaleBox!.height).toBeGreaterThanOrEqual(280)
  expect(whaleBox!.height).toBeLessThanOrEqual(460)
  expect(whaleBox!.x + whaleBox!.width).toBeGreaterThan(VIEWPORT.width * 0.6)
  expect(whaleBox!.y + whaleBox!.height).toBeGreaterThan(VIEWPORT.height * 0.6)

  // CTR-OVERLAY-003: the LARGE default placement reserves bottom space that
  // clears the whale's default footprint — zero intersection.
  expect(overlapArea(petBox!, whaleBox!)).toBe(0)
  // And the pet still sits fully inside the viewport.
  expect(petBox!.x).toBeGreaterThanOrEqual(0)
  expect(petBox!.y).toBeGreaterThanOrEqual(0)
  expect(petBox!.x + petBox!.width).toBeLessThanOrEqual(VIEWPORT.width)
  expect(petBox!.y + petBox!.height).toBeLessThanOrEqual(VIEWPORT.height)

  await page.screenshot({ path: `${ARTIFACTS}/coexistence-both-pets.png` })

  // Neither plugin produced console errors or uncaught exceptions.
  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})

test('CHARACTER_V4_COEXISTENCE. companion and descriptive label clear whale, composer and send', async ({page})=>{
  await page.goto('/')
  await connectWorkspaceAndSendPrompt(page)
  await expect(page.locator(PET)).toHaveCount(1)
  const trigger=page.locator('[data-vehicle-pet-menu-trigger]')
  await trigger.focus(); await trigger.click()
  await page.locator('[data-vehicle-pet-character-option="companion"]').click()
  await page.keyboard.press('Escape')
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-character','companion')
  await expect(page.locator('.vpo-scene .vp-scene')).toHaveCount(0)
  await page.waitForTimeout(1500)
  const shell=await page.locator(SHELL).boundingBox()
  for(const target of [page.locator(WHALE),page.locator('textarea:enabled').last(),page.getByRole('button',{name:/发送消息|Send message/}).first()]) {
    const box=await target.boundingBox()
    expect(box).not.toBeNull()
    expect(overlapArea(shell!,box!)).toBe(0)
  }
  await page.screenshot({path:`${ARTIFACTS}/character-v4-whale-coexistence.png`})
  await trigger.focus(); await trigger.click()
  await page.locator('[data-vehicle-pet-size-option="small"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(350)
  const smallShell=await page.locator(SHELL).boundingBox()
  const whaleBox=await page.locator(WHALE).boundingBox()
  expect(overlapArea(smallShell!,whaleBox!)).toBe(0)
  await page.screenshot({path:`${ARTIFACTS}/character-v4-whale-small.png`})
})
