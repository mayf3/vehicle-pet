/**
 * ACC-USG-008 — Isolated DSH integration for DshUsageProgressSource.
 *
 * Uses the PRODUCTION bundle installed into the disposable DSH home (no E2E
 * progress-source swap): real browser-driven turns through the pinned mock
 * LLM produce real provider usage, the deployment's token-meter projection
 * carries counts, and the resident pet's progress must grow through the
 * ProgressSnapshotV1 seam — visible via the plugin's inert data attributes and
 * the usage ledger record.
 */

import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const WORKSPACE = '/tmp/vehicle-pet-overlay-e2e-workspace'
const ARTIFACTS = 'tests/dsh/e2e/.artifacts'

async function dismissStartupDialogs(page: Page): Promise<void> {
  // First-run chain: the beta notice (继续), then the official-API-key
  // onboarding modal (稍后配置 / Configure later).
  for (let round = 0; round < 6; round += 1) {
    const beta = page.getByRole('dialog', { name: /内测声明|Internal Testing Notice/ })
    await beta.waitFor({ timeout: round === 0 ? 5_000 : 1_000 }).catch(() => {})
    if (await beta.count() > 0) {
      await beta.getByRole('button', { name: /继续|Continue/ }).click()
      await page.waitForTimeout(500)
      continue
    }
    const keyDialog = page.getByRole('dialog', { name: /添加一个 API Key|Add an API key/ })
    await keyDialog.waitFor({ timeout: 2_000 }).catch(() => {})
    if (await keyDialog.count() > 0) {
      await keyDialog.getByRole('button', { name: /稍后配置|Configure later/ }).click()
      await page.waitForTimeout(500)
      continue
    }
    break
  }
}

async function connectWorkspace(page: Page): Promise<void> {
  mkdirSync(WORKSPACE, { recursive: true })
  const picker = page.getByRole('textbox', { name: /Choose workspace|选择工作区/ })
  const newSession = page.getByRole('button', { name: /New Session|新建会话|New chat|新会话/i }).first()
  // App boot is asynchronous: wait until the first-run picker, an open
  // composer, or the sidebar New Session control exists, dismissing the
  // first-run modal chain while we wait.
  await expect.poll(async () => {
    await dismissStartupDialogs(page)
    return Number(await picker.isVisible().catch(() => false))
      + await page.locator('textarea:enabled').count()
      + Number(await newSession.isVisible().catch(() => false))
  }, { timeout: 45_000 }).toBeGreaterThan(0)

  if (await picker.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await picker.click()
    const dialog = page.getByRole('dialog', { name: /Select Workspace Directory|选择工作区目录/ })
    await dialog.waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /Edit path|编辑路径/ }).click()
    const pathInput = dialog.getByRole('textbox', { name: /Edit path|编辑路径/ })
    await pathInput.fill(WORKSPACE)
    await pathInput.press('Enter')
    await dialog.getByRole('button', { name: /^(Open|打开)$/ }).click()
  } else {
    await newSession.click()
  }
  const composer = page.locator('textarea:enabled').last()
  await composer.waitFor({ timeout: 20_000 })
}

async function petState(page: Page) {
  return page.evaluate(() => {
    const pet = document.querySelector('[data-vehicle-pet-pet="true"]')
    return {
      visible: document.querySelector('[data-vehicle-pet]') !== null,
      level: pet?.getAttribute('data-vehicle-pet-level') ?? null,
      pack: pet?.getAttribute('data-vehicle-pet-pack') ?? null,
      // V3 CTR-OVERLAY-016: the resident surface renders no progress bar; the
      // usage seam is observed through the ledger record below instead.
      ledgerRaw: window.localStorage.getItem('vehicle-pet/usage-ledger/v1'),
    }
  })
}

test('real DSH usage drives the resident pet through the snapshot seam', async ({ page }) => {
  // Other session tests deliberately consume approval/failure slots. This
  // usage probe needs completed turns, independent of their script position.
  const resetMock = async () => {
    const reset = await fetch('http://127.0.0.1:8902/reset', { method: 'POST' })
    expect(reset.ok).toBe(true)
  }
  await resetMock()
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await connectWorkspace(page)

  const composer = page.locator('textarea:enabled').last()
  await page.screenshot({ path: `${ARTIFACTS}/usage-live-before.png` })

  await composer.fill('usage-live-1: 演示两数相加')
  await composer.press('Enter')
  // The mock streams a completion; provider usage lands in the projection.
  await page.waitForTimeout(18_000)

  const after1 = await petState(page)
  console.log('[usage-live] after1:', JSON.stringify(after1))
  await page.screenshot({ path: `${ARTIFACTS}/usage-live-after-1.png` })

  await resetMock()
  await composer.fill('usage-live-2: 再演示一段字符串反转')
  await composer.press('Enter')
  await page.waitForTimeout(18_000)

  const after2 = await petState(page)
  console.log('[usage-live] after2:', JSON.stringify(after2))
  await page.screenshot({ path: `${ARTIFACTS}/usage-live-after-2.png` })

  // The ledger record proves the source observed counted usage and applied it
  // monotonically (CTR-USG-008/009): it exists once usage was observed, and
  // both daily tokens and cumulative points never regressed.
  const parse = (raw: string | null) => {
    if (raw === null) return null
    const parsed = JSON.parse(raw) as { cumulativePoints?: number; byDay?: Record<string, { dailyTokens?: number }> }
    return {
      points: parsed.cumulativePoints ?? 0,
      tokens: Object.values(parsed.byDay ?? {}).reduce((sum, day) => sum + (day.dailyTokens ?? 0), 0),
    }
  }
  const observed = [parse(after1.ledgerRaw), parse(after2.ledgerRaw)].filter(v => v !== null) as Array<{ points: number; tokens: number }>
  expect(observed.length).toBeGreaterThan(0)
  // Real counted usage was attributed in the deployed app (the mock's output
  // is tiny, so integer points may legitimately stay 0 — the frozen formula's
  // point accrual is covered by exact unit vectors; what must hold live is
  // that counted growth reached the ledger and never regressed).
  expect(observed.at(-1)!.tokens).toBeGreaterThan(0)
  if (observed.length === 2) {
    expect(observed[1]!.tokens).toBeGreaterThanOrEqual(observed[0]!.tokens)
    expect(observed[1]!.points).toBeGreaterThanOrEqual(observed[0]!.points)
  }
  // The resident pet stayed present and valid the whole time (silent seam).
  expect(after2.visible).toBe(true)
  expect(after2.level).toMatch(/^l\d+$/)
})
