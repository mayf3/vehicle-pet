/**
 * DSH overlay browser acceptance (ACC-OVERLAY-002..017) against the pinned
 * DeepSeek Harness Web in a disposable home. Serialized: the mock LLM serves
 * one scripted behavior per model request, so the session-driven states
 * (running / needs-input / completed / failed / cancelled) walk in order.
 *
 * Production-only: no Vite dev server, no port 5199, no iframe; every pet
 * asset is inlined. The standalone prototype regression is covered by the
 * repository's own `pnpm verify` (Playwright against the Vite app).
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { expect, test, type Page, type Request } from '@playwright/test'

const ARTIFACTS = 'tests/dsh/e2e/.artifacts'
const PET = '[data-vehicle-pet-pet="true"]'
const LAUNCHER = '[data-vehicle-pet-launcher="true"]'
const PANEL = '[data-vehicle-pet-panel="true"]'
const PILL = '[data-pet-host-feedback]'
const VIEWPORT = { width: 1440, height: 900 } as const

const seenRequests: Request[] = []
const consoleErrors: string[] = []

test.beforeAll(async ({ browser }) => {
  mkdirSync(ARTIFACTS, { recursive: true })
  const context = await browser.newContext({ viewport: VIEWPORT })
  context.on('request', request => {
    seenRequests.push(request)
  })
  await context.close()
})

let trackedContext: import('@playwright/test').BrowserContext | null = null

test.beforeEach(async ({ context, page }) => {
  const reset = await fetch('http://127.0.0.1:8902/reset', { method: 'POST' })
  if (!reset.ok) throw new Error(`mock supervisor reset failed: ${reset.status}`)
  context.on('request', request => {
    seenRequests.push(request)
  })
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => {
    consoleErrors.push(error.message)
  })
  trackedContext = context
})

async function dismissStartupDialogs(page: Page): Promise<void> {
  // First-run chain: the beta notice (继续), then the official-API-key
  // onboarding modal (稍后配置 / Configure later). Dismiss every occurrence
  // until no modal mask remains.
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

async function connectWorkspace(page: Page): Promise<void> {
  const workspace = '/tmp/vehicle-pet-overlay-e2e-workspace'
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
  } else {
    // repeat-each reuses the disposable host, so later repetitions start in
    // the prior Session. Establish a fresh blank Session before turn 1.
    const newSession = page.getByRole('button', { name: /New Session|新建会话|New chat|新会话/i }).first()
    await newSession.waitFor({ timeout: 20_000 })
    await newSession.click()
  }
  const composer = page.locator('textarea:enabled').last()
  await composer.waitFor({ timeout: 20_000 })
  await expect(composer).toBeEditable()
}

async function sendPrompt(page: Page, text: string): Promise<void> {
  const composer = page.locator('textarea:enabled').last()
  await composer.waitFor({ state: 'visible', timeout: 20_000 })
  await expect(composer).toBeEditable()
  await composer.fill(text)
  await expect(composer).toHaveValue(text)
  // A submit is accepted only after the current Session's composer handshake
  // completes. Falling back to Enter here can target the previous Session
  // during a session-switch render and was the R1 second-session race.
  const send = page.getByRole('button', { name: /发送消息|Send message/ }).first()
  await expect(send).toBeEnabled({ timeout: 20_000 })
  await send.click()
  await expect(composer).toHaveValue('', { timeout: 20_000 })
}

async function petBox(page: Page) {
  return page.locator(PET).boundingBox()
}

/**
 * Record every host-feedback pill as it appears (they auto-clear after ~3.2s,
 * so assertions must not race the visible window). Returns the recorder's
 * snapshot reader.
 */
interface PillRecorder {
  readonly id: string
  read(): Promise<string[]>
}

async function installPillRecorder(page: Page): Promise<PillRecorder> {
  const id = `recorder-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await page.evaluate(recorderId => {
    const record: string[] = []
    const capture = () => {
      const pill = document.querySelector('[data-pet-host-feedback]')
      const terminal = document.querySelector('[data-vehicle-pet-pet]')
      const status = pill?.getAttribute('data-pet-host-feedback')
        ?? terminal?.getAttribute('data-terminal')
      if (status !== undefined && status !== null && record[record.length - 1] !== status) {
        record.push(status)
      }
    }
    const observer = new MutationObserver(capture)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pet-host-feedback', 'data-terminal'],
    })
    ;(window as unknown as {
      __vpRecorder: { id: string; record: string[]; observer: MutationObserver }
    }).__vpRecorder = { id: recorderId, record, observer }
    capture()
  }, id)
  return {
    id,
    read: () => page.evaluate(expectedId => {
      const recorder = (window as unknown as {
        __vpRecorder?: { id: string; record: string[] }
      }).__vpRecorder
      if (recorder?.id !== expectedId) return []
      return recorder.record
    }, id),
  }
}

/** Fresh page bootstrap: load the app and wait for the mounted pet. */
async function openOverlay(page: Page): Promise<void> {
  await page.goto('/')
  await dismissStartupDialogs(page)
  if (await page.locator(PET).count() === 0) {
    const workspacePicker = page.getByRole('textbox', { name: /Choose workspace|选择工作区/ })
    if (await workspacePicker.isVisible().catch(() => false)) {
      await connectWorkspace(page)
    } else {
      await page.locator('textarea:enabled').last().waitFor({ timeout: 20_000 })
    }
    await sendPrompt(page, `e2e-bootstrap-${Date.now()}`)
  }
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
}

test('23. onboarding: fresh boot renders no pet, launcher, panel, or dialog DOM', async ({ page }) => {
  await page.goto('/')
  await dismissStartupDialogs(page)
  await page.getByRole('textbox', { name: /Choose workspace|选择工作区/ }).waitFor({ timeout: 30_000 })
  // Structured onboarding state (ready + no current session) suppresses every surface.
  await expect.poll(() => page.locator(PET).count()).toBe(0)
  await expect.poll(() => page.locator(LAUNCHER).count()).toBe(0)
  await expect.poll(() => page.locator('.vpo-root').count()).toBe(0)
})

test('24 + 16 + 18 + 21 + 17 + 19 + 20 + 22. structured session lifecycle drives the pet', async ({ page }) => {
  await page.goto('/')
  await connectWorkspace(page)
  await sendPrompt(page, 'e2e-turn-1: complete normally')

  // Onboarding ends with the first accepted prompt; exactly one entry mounts.
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  expect(await page.locator('.vpo-root').count()).toBe(1)
  // The turn streams slowly (mock chunk delay); the working state is visible
  // until the terminal edge lands. Screenshot as soon as running is observed.
  const pillsBeforeReload = await installPillRecorder(page)
  await expect
    .poll(async () => (await page.locator(PET).getAttribute('data-live')) === 'running'
      || (await pillsBeforeReload.read()).includes('completed'), { timeout: 60_000 })
    .toBe(true)
  const sawRunning = await page.locator(PET).getAttribute('data-live') === 'running'
  if (sawRunning) await page.screenshot({ path: `${ARTIFACTS}/working.png` })

  // Turn 1 completes with one short completed pill (mock: slow_success).
  await expect.poll(async () => (await pillsBeforeReload.read()).includes('completed'), { timeout: 90_000 }).toBe(true)
  await expect.poll(async () => (await pillsBeforeReload.read()).length, { timeout: 15_000 }).toBe(1)
  await expect.poll(async () => (await page.locator(PILL).count()), { timeout: 15_000 }).toBe(0)

  // Reload cannot replay the completed terminal (edge dedupe).
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const pillsAfterReload = await installPillRecorder(page)
  expect(pillsAfterReload.id).not.toBe(pillsBeforeReload.id)
  await page.waitForTimeout(4200)
  expect(await page.locator(PILL).count()).toBe(0)
  expect(await pillsAfterReload.read()).toEqual([])
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 15_000 }).toBe('idle')
  // From here the reload-time recorder owns the remaining phases.
  const pills = pillsAfterReload

  // Turn 2 asks a scripted question: the structured pending question is the
  // needs-input state; answer it so the turn continues into server_error.
  await sendPrompt(page, 'e2e-turn-2: ask the scripted question')
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 60_000 }).toBe('needs-input')
  await expect(page.locator('.vpo-badge')).toHaveCount(1)
  await page.screenshot({ path: `${ARTIFACTS}/needs-input.png` })
  const question = page.locator('[data-question-key]')
  await question.waitFor({ timeout: 20_000 })
  await question.getByText('Yes, continue', { exact: true }).click()
  await question.getByRole('textbox').press('Enter')

  // The post-tool follow-up hits invalid_request: the failed reaction.
  await expect.poll(async () => (await pills.read()).includes('failed'), { timeout: 90_000 }).toBe(true)
  await expect.poll(async () => (await page.locator(PILL).count()), { timeout: 30_000 }).toBe(0)

  // Turn 3 stalls; Stop cancels it: the cancelled reaction.
  await sendPrompt(page, 'e2e-turn-3: stall then cancel')
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 60_000 }).toBe('running')
  const stop = page.getByRole('button', { name: 'Stop generating' })
  await stop.waitFor({ timeout: 30_000 })
  await stop.click()
  await expect.poll(async () => (await pills.read()).includes('cancelled'), { timeout: 60_000 }).toBe(true)
  await expect.poll(async () => (await page.locator(PILL).count()), { timeout: 30_000 }).toBe(0)

  // A second session: no stale reaction leaks across the switch. Reload
  // first so the fresh mount also proves the reload-time terminal seeding.
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const pillsAfterSecondReload = await installPillRecorder(page)
  expect(pillsAfterSecondReload.id).not.toBe(pillsAfterReload.id)
  await page.waitForTimeout(4200)
  expect(await page.locator(PILL).count()).toBe(0)
  expect(await pillsAfterSecondReload.read()).toEqual([])
  const root = page.locator('.vpo-root')
  const previousSessionId = await root.getAttribute('data-session-list-current')
  const previousGeneration = Number(await root.getAttribute('data-adapter-generation'))
  expect(previousSessionId).toBeTruthy()
  expect(Number.isSafeInteger(previousGeneration)).toBe(true)

  const newSession = page.getByRole('button', { name: /New Session|新建会话|New chat|新会话/i }).first()
  await newSession.waitFor({ timeout: 20_000 })
  await newSession.click()

  // A fresh blank Session is a typed onboarding state, so the product surface
  // is intentionally absent while its composer is already ready. Submit only
  // after that explicit composer handshake; the accepted prompt then makes the
  // typed Session non-blank and exposes the adapter rebind facts.
  await expect.poll(() => page.locator(PILL).count(), { timeout: 20_000 }).toBe(0)
  const secondComposer = page.locator('textarea:enabled').last()
  await secondComposer.waitFor({ state: 'visible', timeout: 20_000 })
  await expect(secondComposer).toBeEditable()
  await expect(secondComposer).toHaveValue('')
  await sendPrompt(page, 'e2e-session-2: complete')

  await expect.poll(async () => {
    if (await root.count() !== 1) return false
    const listCurrent = await root.getAttribute('data-session-list-current')
    const adapterCurrent = await root.getAttribute('data-adapter-session')
    const generation = Number(await root.getAttribute('data-adapter-generation'))
    return listCurrent !== null
      && listCurrent !== previousSessionId
      && await root.getAttribute('data-session-list-contains-current') === 'true'
      && adapterCurrent === listCurrent
      && await root.getAttribute('data-adapter-binding-ready') === 'true'
      && generation > previousGeneration
  }, { timeout: 30_000 }).toBe(true)
  const secondSessionId = await root.getAttribute('data-session-list-current')
  const secondGeneration = await root.getAttribute('data-adapter-generation')

  // Submission stays bound to the new generation, reaches running, then emits
  // exactly the new completed terminal. The pre-switch terminal was not replayed.
  await expect(root).toHaveAttribute('data-adapter-session', secondSessionId ?? '')
  await expect(root).toHaveAttribute('data-adapter-generation', secondGeneration ?? '')
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 60_000 }).toBe('running')
  await expect.poll(async () =>
    (await pillsAfterSecondReload.read()).includes('completed'), { timeout: 90_000 }).toBe(true)
  expect((await pillsAfterSecondReload.read()).filter(status => status === 'completed')).toHaveLength(1)
  await expect.poll(async () => (await page.locator(PILL).count()), { timeout: 30_000 }).toBe(0)
})

test('2 + 3. default bottom-right placement and 112px visible size', async ({ page }) => {
  await openOverlay(page)
  const box = await petBox(page)
  expect(box).not.toBeNull()
  expect(box!.width).toBe(112)
  expect(box!.height).toBe(112)
  expect(box!.x).toBeGreaterThan(VIEWPORT.width / 2)
  expect(box!.y).toBeGreaterThan(VIEWPORT.height / 2)
  expect(VIEWPORT.width - (box!.x + box!.width)).toBeLessThanOrEqual(40)
  expect(VIEWPORT.height - (box!.y + box!.height)).toBeLessThanOrEqual(40)
  await page.screenshot({ path: `${ARTIFACTS}/visible.png` })
})

test('4 + 5 + 6. click toggles the 320px panel whose content is exactly the authorized items', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  const panel = page.locator(PANEL)
  await panel.waitFor()
  const box = await panel.boundingBox()
  expect(box!.width).toBe(320)
  for (const selector of [
    '[data-vehicle-pet-pack-name]',
    '[data-vehicle-pet-stage]',
    '[data-vehicle-pet-progress]',
    '[data-vehicle-pet-keepsake]',
    '[data-vehicle-pet-pack-switch]',
    '[data-vehicle-pet-reduced-motion]',
    '[data-vehicle-pet-collapse]',
    '[data-vehicle-pet-open-journey]',
  ]) {
    expect(await panel.locator(selector).count()).toBe(1)
  }
  const text = await panel.textContent()
  expect(text).not.toContain('Mock')
  expect(text).not.toContain('诊断')
  await page.screenshot({ path: `${ARTIFACTS}/panel-open.png` })
  await page.locator(PET).click()
  await expect.poll(() => page.locator(PANEL).count()).toBe(0)
})

test('7. drag moves the pet and does not toggle the panel', async ({ page }) => {
  await openOverlay(page)
  const before = await petBox(page)
  const pet = page.locator(PET)
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(before!.x - 120, before!.y - 40, { steps: 6 })
  await page.mouse.up()
  const after = await petBox(page)
  expect(after!.x).toBeLessThan(before!.x - 30)
  expect(page.locator(PANEL)).toHaveCount(0)
})

test('8. the dragged position survives reload as normalized ratios', async ({ page }) => {
  await openOverlay(page)
  const pet = page.locator(PET)
  const origin = await petBox(page)
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(origin!.x - 180, origin!.y - 100, { steps: 8 })
  await page.mouse.up()
  const before = await petBox(page)
  const stored = await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))
  const record = JSON.parse(stored ?? '{}') as { position: { xRatio: number; yRatio: number } }
  expect(Number.isFinite(record.position.xRatio)).toBe(true)
  expect(record.position.xRatio).toBeLessThan(0.95)
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const after = await petBox(page)
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(4)
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(4)
})

test('9. viewport resize clamps the full surface inside the viewport', async ({ page }) => {
  await openOverlay(page)
  await page.setViewportSize({ width: 800, height: 600 })
  await page.waitForTimeout(400)
  const box = await petBox(page)
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(800)
  expect(box!.y + box!.height).toBeLessThanOrEqual(600)
  await page.setViewportSize(VIEWPORT)
})

test('10. keyboard movement moves and persists new ratios', async ({ page }) => {
  await openOverlay(page)
  const pet = page.locator(PET)
  await pet.focus()
  const before = await petBox(page)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Shift+ArrowUp')
  await page.waitForTimeout(300)
  const after = await petBox(page)
  expect(after!.x).toBeLessThan(before!.x - 10)
  expect(after!.y).toBeLessThan(before!.y - 20)
})

test('11 + 12. collapse to the 36px launcher and restore', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  await page.locator('[data-vehicle-pet-collapse]').click()
  const launcher = page.locator(LAUNCHER)
  await launcher.waitFor()
  await expect.poll(async () => (await launcher.boundingBox())?.width).toBe(36)
  const box = await launcher.boundingBox()
  expect(box!.height).toBe(36)
  expect(await page.locator(PET).count()).toBe(0)
  await page.screenshot({ path: `${ARTIFACTS}/collapsed.png` })
  await launcher.click()
  await expect.poll(async () => (await petBox(page))?.width).toBe(112)
})

test('13. pack switching works both ways and keeps progress points identical', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  const progressText = async () => {
    const text = await page.locator('[data-vehicle-pet-progress]').textContent()
    return /^([0-9,.]+)/.exec((text ?? '').replace(/\s/g, ''))?.[1] ?? ''
  }
  const fleetName = await page.locator('[data-vehicle-pet-pack-name]').textContent()
  const before = await progressText()
  await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
  await expect.poll(async () => await page.locator('[data-vehicle-pet-pack-name]').textContent()).not.toBe(fleetName)
  expect(await progressText()).toBe(before)
  await page.locator('[data-vehicle-pet-pack-option="autonomous-fleet"]').click()
  await expect.poll(async () => await page.locator('[data-vehicle-pet-pack-name]').textContent()).toBe(fleetName)
  expect(await progressText()).toBe(before)
})

test('14 + 15. full journey dialog is accessible and restores focus on close', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  const trigger = page.locator('[data-vehicle-pet-open-journey]')
  await trigger.click()
  const dialog = page.locator('[data-vehicle-pet-dialog]')
  await dialog.waitFor()
  await expect(dialog).toHaveAttribute('role', 'dialog')
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.vp-scene')).toHaveCount(1)
  await expect(dialog.locator('.vp-keepsake-list')).toHaveCount(1)
  await page.screenshot({ path: `${ARTIFACTS}/journey-dialog.png` })
  const focused = await dialog.evaluate(node => node.contains(document.activeElement))
  expect(focused).toBe(true)
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator('[data-vehicle-pet-dialog]').count()).toBe(0)
  const focusRestored = await trigger.evaluate(node => document.activeElement === node)
  expect(focusRestored).toBe(true)
  await page.locator(PET).click({ position: { x: 4, y: 4 } })
})

test('25. ordinary conversation and settings surfaces keep the pet available', async ({ page }) => {
  await openOverlay(page)
  await expect.poll(() => page.locator(PET).count()).toBe(1)

  const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
  await settings.waitFor({ timeout: 20_000 })
  await settings.click()
  await expect.poll(() => page.locator(PET).count(), { timeout: 20_000 }).toBe(1)
  await page.keyboard.press('Escape')

  await page.goto('/')
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
})

test('26. multi-tab preference sync through storage events', async ({ context, page }) => {
  await openOverlay(page)
  const second = await context.newPage()
  await second.setViewportSize(VIEWPORT)
  await second.goto('/')
  await expect.poll(() => second.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const before = await second.locator(PET).boundingBox()

  const pet = page.locator(PET)
  const origin = await pet.boundingBox()
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(origin!.x - 200, origin!.y - 120, { steps: 8 })
  await page.mouse.up()

  await expect.poll(async () => {
    const after = await second.locator(PET).boundingBox()
    return after !== null && before !== null && Math.abs(after.x - before!.x) > 40
  }, { timeout: 15_000 }).toBe(true)
  await second.close()
})

test('27. reload and real client-watcher HMR never double-mount or replay terminals', async ({ page }) => {
  await openOverlay(page)
  for (let index = 0; index < 3; index += 1) {
    await page.reload()
    await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
    expect(await page.locator('.vpo-root').count()).toBe(1)
  }

  const root = page.locator('.vpo-root')
  await expect(root).toHaveAttribute('data-client-generation', 'production')
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 90_000 }).toBe('idle')
  await expect.poll(() => page.locator(PILL).count(), { timeout: 30_000 }).toBe(0)
  const recorder = await installPillRecorder(page)
  await page.waitForTimeout(4200)
  expect(await recorder.read()).toEqual([])
  await page.evaluate(() => {
    const trace: { maxEntries: number; generations: string[]; observer?: MutationObserver } = {
      maxEntries: 0,
      generations: [],
    }
    const capture = () => {
      trace.maxEntries = Math.max(trace.maxEntries, document.querySelectorAll('[data-vehicle-pet]').length)
      const generation = document.querySelector('[data-vehicle-pet]')?.getAttribute('data-client-generation')
      if (generation !== null && generation !== undefined && trace.generations.at(-1) !== generation) {
        trace.generations.push(generation)
      }
    }
    const observer = new MutationObserver(capture)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    trace.observer = observer
    ;(window as unknown as { __vpHmrTrace: typeof trace }).__vpHmrTrace = trace
    capture()
  })

  try {
    execFileSync('pnpm', ['build:dsh'], {
      cwd: process.cwd(),
      env: { ...process.env, VEHICLE_PET_CLIENT_GENERATION: 'hmr-r1-generation-2' },
      stdio: 'pipe',
    })
    await expect(root).toHaveAttribute('data-client-generation', 'hmr-r1-generation-2', { timeout: 60_000 })
    expect(await page.locator('.vpo-root').count()).toBe(1)
    expect(await recorder.read()).toEqual([])

    // The pre-HMR terminal stays seeded and does not replay while the new
    // generation binds the same current Session.
    await page.waitForTimeout(4200)
    expect(await recorder.read()).toEqual([])

    const trace = await page.evaluate(() => {
      const value = (window as unknown as {
        __vpHmrTrace: { maxEntries: number; generations: string[] }
      }).__vpHmrTrace
      return { maxEntries: value.maxEntries, generations: value.generations }
    })
    expect(trace.maxEntries).toBe(1)
    expect(trace.generations).toContain('production')
    expect(trace.generations).toContain('hmr-r1-generation-2')
  } finally {
    execFileSync('pnpm', ['build:dsh'], { cwd: process.cwd(), stdio: 'pipe' })
    await expect(root).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
  }
})

test('29 + 30 + 31. no external pet requests, no iframe, no port 5199', async ({ page }) => {
  await openOverlay(page)
  const foreign = seenRequests.filter(request => {
    const url = new URL(request.url())
    return url.origin !== new URL(page.url()).origin
  })
  expect(foreign).toEqual([])
  const requests5199 = seenRequests.filter(request => request.url().includes(':5199'))
  expect(requests5199).toEqual([])
  expect(await page.locator('iframe').count()).toBe(0)
  expect(page.frames().filter(frame => frame !== page.mainFrame())).toEqual([])
})

test('32. no React invalid-hook-call or second-runtime console errors', async () => {
  const invalid = consoleErrors.filter(text =>
    text.includes('Invalid hook call') || text.includes('rendered fewer hooks') || text.includes('Rules of Hook'))
  expect(invalid).toEqual([])
})

test.afterAll(async () => {
  await trackedContext?.close().catch(() => {})
})
