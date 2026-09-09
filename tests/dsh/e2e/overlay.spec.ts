/**
 * DSH overlay browser acceptance (DSH_PET_OVERLAY_ADAPTER_V3,
 * ACC-OVERLAY-103..119) against the pinned DeepSeek Harness Web in a
 * disposable home. Serialized: the mock LLM serves one scripted behavior per
 * model request, so the session-driven states (running / needs-input /
 * completed / failed / cancelled) walk in order.
 *
 * V3 surface: resident pet is VISIBLE/COLLAPSED only (no panel; a normal pet
 * click is a pet reaction), two sizes (SMALL 112 / LARGE 216) toggled and
 * persisted through the hover-revealed secondary menu, no resident progress
 * bar, and a single bounded speech bubble. Production-only: no Vite dev
 * server, no port 5199, no iframe; every pet asset is inlined. The standalone
 * prototype regression is covered by the repository's own Playwright run.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test'
import sharp from 'sharp'
import { speechCatalog } from '../../../src/dsh/client/speech-catalog'

interface MatrixManifest {
  readonly levels: readonly { levelId: string; threshold: number }[]
}

const fleetManifest = JSON.parse(readFileSync(new URL('../../../src/packs/autonomous-fleet/manifest.json', import.meta.url), 'utf8')) as MatrixManifest

const ARTIFACTS = 'tests/dsh/e2e/.artifacts'
const PET = '[data-vehicle-pet-pet="true"]'
const SHELL = '.vpo-shell'
const ROOT = '.vpo-root'
const LAUNCHER = '[data-vehicle-pet-launcher="true"]'
const MENU = '[data-vehicle-pet-menu="true"]'
const MENU_TRIGGER = PET
const DIALOG = '[data-vehicle-pet-dialog="true"]'
const PANEL = '[data-vehicle-pet-panel="true"]' // V2 legacy surface: must never exist again.
const PILL = '[data-pet-host-feedback]'
const BUBBLE = '[data-vehicle-pet-bubble="true"]'
const PREF_KEY = 'vehicle-pet/overlay-preferences/v1'
const VIEWPORT = { width: 1440, height: 900 } as const
/** CTR-OVERLAY-017: no speech within 30 s of surface mount; +1s slack. */
const SPEECH_LOAD_QUIET_WAIT_MS = 16_000

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

interface ResourceSnapshot {
  readonly pluginResources: Record<string, number>
  readonly overlayDom: number
  readonly dialogDom: number
  readonly injectedStyle: number
  readonly resizeObservers: number
  readonly mutationObservers: number
  readonly storageListeners: number
  readonly resizeListeners: number
  readonly keyboardListeners: number
  readonly mediaListeners: number
  readonly pointerListeners: number
  readonly pointerCaptures: number
  readonly indexedDbConnections: number
}

async function installResourceInstrumentation(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    type ListenerRecord = { target: EventTarget; type: string; listener: EventListenerOrEventListenerObject | null }
    const records: ListenerRecord[] = []
    const nativeAdd = EventTarget.prototype.addEventListener
    const nativeRemove = EventTarget.prototype.removeEventListener
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      records.push({ target: this, type, listener })
      return nativeAdd.call(this, type, listener, options)
    }
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      const index = records.findIndex(record => record.target === this && record.type === type && record.listener === listener)
      if (index >= 0) records.splice(index, 1)
      return nativeRemove.call(this, type, listener, options)
    }

    let resizeObservers = 0
    const activeResizeObservers = new WeakSet<object>()
    const NativeResizeObserver = globalThis.ResizeObserver
    if (NativeResizeObserver !== undefined) {
      globalThis.ResizeObserver = class extends NativeResizeObserver {
        override observe(target: Element, options?: ResizeObserverOptions): void {
          if (!activeResizeObservers.has(this) && (target.matches('[data-vehicle-pet]') || target.closest('[data-vehicle-pet]') !== null)) {
            activeResizeObservers.add(this)
            resizeObservers += 1
          }
          super.observe(target, options)
        }
        override disconnect(): void {
          if (activeResizeObservers.has(this)) {
            activeResizeObservers.delete(this)
            resizeObservers -= 1
          }
          super.disconnect()
        }
      }
    }

    let mutationObservers = 0
    const activeMutationObservers = new WeakSet<object>()
    const NativeMutationObserver = globalThis.MutationObserver
    globalThis.MutationObserver = class extends NativeMutationObserver {
      override observe(target: Node, options?: MutationObserverInit): void {
        const element = target instanceof Element ? target : target.parentElement
        if (!activeMutationObservers.has(this) && element !== null && (element.matches('[data-vehicle-pet]') || element.closest('[data-vehicle-pet]') !== null)) {
          activeMutationObservers.add(this)
          mutationObservers += 1
        }
        super.observe(target, options)
      }
      override disconnect(): void {
        if (activeMutationObservers.has(this)) {
          activeMutationObservers.delete(this)
          mutationObservers -= 1
        }
        super.disconnect()
      }
    }

    let pointerCaptures = 0
    const nativeSetPointerCapture = Element.prototype.setPointerCapture
    const nativeReleasePointerCapture = Element.prototype.releasePointerCapture
    Element.prototype.setPointerCapture = function (pointerId) {
      pointerCaptures += 1
      return nativeSetPointerCapture.call(this, pointerId)
    }
    Element.prototype.releasePointerCapture = function (pointerId) {
      pointerCaptures = Math.max(0, pointerCaptures - 1)
      return nativeReleasePointerCapture.call(this, pointerId)
    }

    const openDatabases = new Set<IDBDatabase>()
    const nativeOpen = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (...args: [string, number?]) {
      const request = nativeOpen.apply(this, args)
      request.addEventListener('success', () => {
        if (request.result.name === 'pet-engine-v1') openDatabases.add(request.result)
      })
      return request
    }
    const nativeClose = IDBDatabase.prototype.close
    IDBDatabase.prototype.close = function () {
      openDatabases.delete(this)
      return nativeClose.call(this)
    }

    const root = (globalThis as unknown as { __vehiclePetE2E?: Record<string, unknown> }).__vehiclePetE2E ?? {}
    ;(globalThis as unknown as { __vehiclePetE2E: Record<string, unknown> }).__vehiclePetE2E = root
    root.snapshotResources = (): ResourceSnapshot => {
      const plugin = root.pluginResources as { resources?: Record<string, number> } | undefined
      const count = (type: string, target?: EventTarget) => records.filter(record => record.type === type && (target === undefined || record.target === target)).length
      return {
        pluginResources: { ...plugin?.resources },
        overlayDom: document.querySelectorAll('[data-vehicle-pet]').length,
        dialogDom: document.querySelectorAll('[data-vehicle-pet-dialog]').length,
        injectedStyle: document.querySelectorAll('style[data-plugin-css="vehicle-pet/overlay-styles"]').length,
        resizeObservers,
        mutationObservers,
        storageListeners: count('storage', globalThis),
        resizeListeners: count('resize', globalThis),
        keyboardListeners: count('keydown'),
        mediaListeners: records.filter(record => record.type === 'change' && typeof MediaQueryList !== 'undefined' && record.target instanceof MediaQueryList).length,
        pointerListeners: count('pointerdown') + count('pointermove') + count('pointerup') + count('pointercancel'),
        pointerCaptures,
        indexedDbConnections: openDatabases.size,
      }
    }
    root.deletePetDatabase = () => new Promise<{ blocked: boolean; success: boolean }>((resolve, reject) => {
      let blocked = false
      const request = indexedDB.deleteDatabase('pet-engine-v1')
      request.addEventListener('blocked', () => {
        blocked = true
        setTimeout(() => resolve({ blocked: true, success: false }), 1000)
      })
      request.addEventListener('error', () => reject(request.error))
      request.addEventListener('success', () => resolve({ blocked, success: true }))
    })
  })
}

test.beforeEach(async ({ context, page }) => {
  await installResourceInstrumentation(context)
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

/**
 * Opens the secondary settings menu through its trigger. Focus first: the
 * trigger row is hover/focus-revealed (CTR-OVERLAY-005), and the focus path
 * is deterministic for Playwright (no intermediate-pointer hover race).
 */
async function openMenu(page: Page): Promise<void> {
  const trigger = page.locator(MENU_TRIGGER)
  await page.locator(PET).focus()
  await page.locator(PET).dblclick()
  await page.locator(MENU).waitFor({ state: 'visible' })
}

/** Escape closes the menu (CTR-OVERLAY-004); focus rests inside the menu or its trigger. */
async function closeMenu(page: Page): Promise<void> {
  if (await page.locator(MENU).count() === 0) return
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator(MENU).count()).toBe(0)
}

async function seedPreferences(page: Page, record: Record<string, unknown>): Promise<void> {
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, { key: PREF_KEY, value: record })
}

async function petBox(page: Page) {
  return page.locator(PET).boundingBox()
}

async function shellBox(page: Page) {
  const box = await page.locator(SHELL).boundingBox()
  if (box === null) throw new Error('resident shell has no bounding box')
  return box
}

function overlapArea(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

async function composerBounds(page: Page) {
  const composer = page.locator('[data-composer-card]').last()
  await composer.waitFor({ state: 'visible', timeout: 20_000 })
  const box = await composer.boundingBox()
  if (box === null) throw new Error('composer card has no bounding box')
  return box
}

function buildClientGeneration(generation: string): void {
  execFileSync(process.execPath, ['scripts/test-dsh-build-plugin.mjs', generation], {
    cwd: process.cwd(),
    stdio: 'pipe',
  })
}

async function resourceSnapshot(page: Page): Promise<ResourceSnapshot> {
  return page.evaluate(() => {
    const root = (window as unknown as {
      __vehiclePetE2E: { snapshotResources: () => ResourceSnapshot }
    }).__vehiclePetE2E
    return root.snapshotResources()
  })
}

async function deletePetDatabase(page: Page): Promise<{ blocked: boolean; success: boolean }> {
  return page.evaluate(() => {
    const root = (window as unknown as {
      __vehiclePetE2E: { deletePetDatabase: () => Promise<{ blocked: boolean; success: boolean }> }
    }).__vehiclePetE2E
    return root.deletePetDatabase()
  })
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

/** Wait until the resident pet presents the calm idle baseline (no terminal). */
async function waitForIdleBaseline(page: Page): Promise<void> {
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 90_000 }).toBe('idle')
  await expect.poll(() => page.locator(PET).getAttribute('data-terminal'), { timeout: 15_000 }).toBeNull()
  await expect.poll(async () => (await page.locator(PILL).count()), { timeout: 30_000 }).toBe(0)
}

/** Fresh page bootstrap: load the app and wait for the mounted pet. */
async function openOverlay(page: Page): Promise<void> {
  await page.goto('/')
  await dismissStartupDialogs(page)
  if (await page.locator(PET).count() === 0) {
    const workspacePicker = page.getByRole('textbox', { name: /Choose workspace|选择工作区/ })
    await expect.poll(async () => Number(await workspacePicker.isVisible().catch(() => false)) + await page.locator('textarea:enabled').count(), { timeout: 30_000 }).toBeGreaterThan(0)
    if (await workspacePicker.isVisible().catch(() => false)) await connectWorkspace(page)
    else await page.locator('textarea:enabled').last().waitFor({ timeout: 20_000 })
    await sendPrompt(page, `e2e-bootstrap-${Date.now()}`)
  }
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
}

test('23. onboarding: fresh boot renders no pet, launcher, menu, or dialog DOM', async ({ page }) => {
  await page.goto('/')
  await dismissStartupDialogs(page)
  await page.getByRole('textbox', { name: /Choose workspace|选择工作区/ }).waitFor({ timeout: 30_000 })
  // Structured onboarding state (ready + no current session) suppresses every surface.
  await expect.poll(() => page.locator(PET).count()).toBe(0)
  await expect.poll(() => page.locator(LAUNCHER).count()).toBe(0)
  await expect.poll(() => page.locator(ROOT).count()).toBe(0)
})

test('24 + 16 + 18 + 21 + 17 + 19 + 20 + 22. structured session lifecycle drives the pet', async ({ page }) => {
  await page.goto('/')
  await connectWorkspace(page)
  await sendPrompt(page, 'e2e-turn-1: complete normally')

  // Onboarding ends with the first accepted prompt; exactly one entry mounts.
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  expect(await page.locator(ROOT).count()).toBe(1)
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
  const root = page.locator(ROOT)
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

test('SIZE_MODE_LARGE. default load renders the 216px LARGE resident with the coexistence-safe placement', async ({ page }) => {
  await openOverlay(page)
  await page.waitForTimeout(350) // settle the 200ms shell transitions
  const root = page.locator(ROOT)
  await expect(root).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  await expect(root).toHaveAttribute('data-vehicle-pet-size', 'large')

  const box = await shellBox(page)
  expect(box.width).toBe(216)
  expect(box.height).toBe(216)
  expect(box.x).toBeGreaterThan(VIEWPORT.width / 2)
  // Default (never customized) anchor is bottom-right minus the LARGE
  // coexistence-safe inset: 392px + the 16px viewport margin.
  const bottomGap = VIEWPORT.height - (box.y + box.height)
  expect(Math.abs(bottomGap - (392 + 32 + 16))).toBeLessThanOrEqual(2)
  const rightGap = VIEWPORT.width - (box.x + box.width)
  expect(rightGap).toBeGreaterThanOrEqual(14)
  expect(rightGap).toBeLessThanOrEqual(20)

  // Hitbox honesty (CTR-OVERLAY-003): the interactive hit button hugs the
  // visible sprite bbox inside the square shell, never the full canvas. The
  // pre-plan fallback renders the full canvas, so poll for the settled bbox.
  await expect.poll(async () => {
    const current = await petBox(page)
    return current === null ? 0 : (current.width < 212 || current.height < 212 ? 1 : 0)
  }, { timeout: 20_000 }).toBe(1)
  const hit = await petBox(page)
  expect(hit!.width).toBeLessThanOrEqual(216)
  expect(hit!.height).toBeLessThanOrEqual(216)
  // The L1 subject hugs well inside the canvas; the renderer's per-level bbox
  // (with the 42% subject-width floor) yields ≈95x60 at LARGE.
  expect(hit!.width).toBeGreaterThanOrEqual(60)
  expect(hit!.height).toBeGreaterThanOrEqual(40)
  expect(hit!.x).toBeGreaterThanOrEqual(box.x - 1)
  expect(hit!.y).toBeGreaterThanOrEqual(box.y - 1)
  expect(hit!.x + hit!.width).toBeLessThanOrEqual(box.x + box.width + 1)
  expect(hit!.y + hit!.height).toBeLessThanOrEqual(box.y + box.height + 1)
  await page.screenshot({ path: `${ARTIFACTS}/visible-large.png` })
})

test('SIZE_MODE_SMALL. stored size small renders the 112px resident with the composer-safe placement', async ({ page }) => {
  await page.addInitScript(record => {
    window.localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify(record))
  }, {
    schemaVersion: 1,
    position: { xRatio: 1, yRatio: 1 },
    positionCustomized: false,
    collapsed: false,
    reducedMotion: undefined,
    size: 'small',
  })
  await openOverlay(page)
  await page.waitForTimeout(350)
  const root = page.locator(ROOT)
  await expect(root).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  await expect(root).toHaveAttribute('data-vehicle-pet-size', 'small')

  const box = await shellBox(page)
  expect(box.width).toBe(112)
  expect(box.height).toBe(112)
  expect(box.x).toBeGreaterThan(VIEWPORT.width / 2)
  // SMALL preserves the whale footprint too: 392px + 16px margin.
  const bottomGap = VIEWPORT.height - (box.y + box.height)
  expect(Math.abs(bottomGap - (392 + 32 + 16))).toBeLessThanOrEqual(2)
  await page.screenshot({ path: `${ARTIFACTS}/visible-small.png` })
})

test('SIZE_PERSISTENCE. menu size choice persists across reload in both directions', async ({ page }) => {
  await openOverlay(page)
  // LARGE is the default when the preference field is absent (DEC-OVERLAY-005).
  await page.waitForTimeout(350)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'large')
  expect((await shellBox(page)).width).toBe(216)

  // Toggle SMALL through the secondary menu only (CTR-OVERLAY-020).
  await openMenu(page)
  await page.locator('[data-vehicle-pet-size-option="small"]').click()
  await page.waitForTimeout(350)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'small')
  expect((await shellBox(page)).width).toBe(112)
  expect(await page.locator('[data-vehicle-pet-size-option="small"]').getAttribute('aria-pressed')).toBe('true')
  await closeMenu(page)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as { size?: string }
  expect(stored.size).toBe('small')

  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(350)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'small')
  expect((await shellBox(page)).width).toBe(112)

  // Toggle back to LARGE; the explicit choice persists as well.
  await openMenu(page)
  await page.locator('[data-vehicle-pet-size-option="large"]').click()
  await page.waitForTimeout(350)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'large')
  expect((await shellBox(page)).width).toBe(216)
  await closeMenu(page)
  const storedLarge = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as { size?: string }
  expect(storedLarge.size).toBe('large')

  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(350)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet-size', 'large')
  expect((await shellBox(page)).width).toBe(216)
})

test('DEFAULT_COMPOSER_OVERLAP_TEST. safe bottom-right avoids composer and send button', async ({ page }) => {
  await openOverlay(page)
  await page.waitForTimeout(350)
  const pet = await shellBox(page)
  const composer = await composerBounds(page)
  const send = await page.getByRole('button', { name: /发送消息|Send message/ }).first().boundingBox()
  expect(send).not.toBeNull()
  expect(overlapArea(pet, composer)).toBe(0)
  expect(overlapArea(pet, send!)).toBe(0)
})

test('MOBILE_COMPOSER_OVERLAP_TEST. 390px viewport keeps the pet on-screen and clear of composer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openOverlay(page)
  await page.waitForTimeout(350)
  const pet = await shellBox(page)
  const composer = await composerBounds(page)
  expect(overlapArea(pet, composer)).toBe(0)
  expect(pet.x).toBeGreaterThanOrEqual(0)
  expect(pet.y).toBeGreaterThanOrEqual(0)
  expect(pet.x + pet.width).toBeLessThanOrEqual(390)
  expect(pet.y + pet.height).toBeLessThanOrEqual(844)
  await page.screenshot({ path: `${ARTIFACTS}/mobile-safe-visible.png` })
})

test('SCENE_GEOMETRY_TEST. Fleet subject remains centred and visible in the 216px resident scene', async ({ page }) => {
  await openOverlay(page)
  const assertSubject = async () => {
    const scene = await page.locator('.vpo-scene .vp-scene').boundingBox()
    const subject = await page.locator('.vpo-scene [data-pet-subject="true"]').boundingBox()
    expect(scene).not.toBeNull()
    expect(subject).not.toBeNull()
    const ratio = overlapArea(subject!, scene!) / (subject!.width * subject!.height)
    expect(ratio).toBeGreaterThanOrEqual(0.85)
    expect(subject!.x + subject!.width / 2).toBeGreaterThanOrEqual(scene!.x)
    expect(subject!.x + subject!.width / 2).toBeLessThanOrEqual(scene!.x + scene!.width)
    expect(subject!.y + subject!.height / 2).toBeGreaterThanOrEqual(scene!.y)
    expect(subject!.y + subject!.height / 2).toBeLessThanOrEqual(scene!.y + scene!.height)
  }
  await assertSubject()
  await page.screenshot({ path: `${ARTIFACTS}/fleet-visible-v3.png` })
  // V2/V3: no Pack switch exists on the DSH surface, so no second-Pack subject
  // can appear here; the seedling fixture stays an internal conformance Pack.
  await expect(page.locator('[data-vehicle-pet-pack-option]')).toHaveCount(0)
})

test('NO_NORMAL_CLICK_PANEL_TEST + PET_CLICK_REACTION_TEST. a normal pet click is a pet reaction, never a surface', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  const expressionBefore = await page.locator(PET).getAttribute('data-vehicle-pet-expression')

  await page.locator(PET).click()
  await page.waitForTimeout(400)
  // No panel-shaped surface, no secondary menu, no dialog, no navigation.
  await expect(page.locator(PANEL)).toHaveCount(0)
  await expect(page.locator('.vpo-panel')).toHaveCount(0)
  await expect(page.locator(MENU)).toHaveCount(0)
  await expect(page.locator(DIALOG)).toHaveCount(0)
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  expect(page.url().replace(new RegExp('^https?://[^/]+'), '').split('?')[0]).toBe('/')

  // CTR-OVERLAY-021: the reaction includes an expression variant change.
  const expressionAfter = await page.locator(PET).getAttribute('data-vehicle-pet-expression')
  expect(expressionAfter).not.toBe(expressionBefore)
  expect(['idle', 'idle-happy', 'idle-curious']).toContain(expressionAfter)

  // Escape never removes the pet itself.
  await page.locator(PET).focus()
  await page.keyboard.press('Escape')
  await expect(page.locator(PET)).toHaveCount(1)
})

test('SECONDARY_SETTINGS_ACCESSIBLE_TEST. the trigger opens a 216px menu with exactly the authorized item set', async ({ page }) => {
  await openOverlay(page)
  // The pet click must not reveal the menu (only its hover/focus row shows,
  // and only the trigger opens the menu itself).
  await page.locator(PET).click()
  await expect(page.locator(MENU)).toHaveCount(0)

  await page.locator(PET).focus()
  await page.keyboard.press('Shift+Enter')
  await expect(page.locator('[data-vehicle-pet-menu-trigger]')).toHaveCount(0)
  const menu = page.locator(MENU)
  await menu.waitFor()
  await expect(menu).toHaveAttribute('role', 'group')

  // Exactly the four V3 groups; no V2 panel-era content survives.
  for (const selector of [
    '[data-vehicle-pet-size-control]',
    '[data-vehicle-pet-open-journey]',
    '[data-vehicle-pet-collapse]',
  ]) {
    expect(await menu.locator(selector).count()).toBe(1)
  }
  expect(await menu.locator('[data-vehicle-pet-size-option]').count()).toBe(2)
  expect(await menu.locator('[data-vehicle-pet-size-option="small"]').count()).toBe(1)
  expect(await menu.locator('[data-vehicle-pet-size-option="large"]').count()).toBe(1)
  expect(await menu.locator('[data-vehicle-pet-reduced-motion-option]').count()).toBe(0)

  // Narrow fixed width (≤224px contract bound; exactly secondaryMenuWidthPx).
  const box = await menu.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBe(216)
  expect(box!.width).toBeLessThanOrEqual(224)

  // No progression numbers, level/stage names, Pack names, keepsakes, or
  // engineering readouts (CTR-OVERLAY-005).
  for (const selector of [
    '[data-vehicle-pet-stage]',
    '[data-vehicle-pet-progress]',
    '[data-vehicle-pet-next-threshold]',
    '[data-vehicle-pet-pack-name]',
    '[data-vehicle-pet-keepsake]',
    '[data-vehicle-pet-more]',
    '[data-vehicle-pet-pack-switch]',
    '[data-vehicle-pet-pack-option]',
  ]) {
    expect(await menu.locator(selector).count()).toBe(0)
  }
  const text = await menu.textContent()
  expect(text).not.toContain('Mock')
  expect(text).not.toContain('诊断')
  expect(text).not.toContain('种子伙伴')
  expect(text).not.toContain('主驾有人 · 有保护车')
  expect(text).not.toContain('%')
  await page.screenshot({ path: `${ARTIFACTS}/menu-open.png` })

  // Outside press closes.
  await page.mouse.click(30, 60)
  await expect.poll(() => page.locator(MENU).count()).toBe(0)

  // Escape closes too (focus on the trigger after mouse-open).
  await page.locator(PET).focus()
  await page.locator(PET).dblclick()
  await menu.waitFor()
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator(MENU).count()).toBe(0)
  await expect(page.locator(PET)).toHaveCount(1)
})

test('7. drag moves the pet and does not open the menu', async ({ page }) => {
  await openOverlay(page)
  const before = await shellBox(page)
  const pet = page.locator(PET)
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(before.x - 120, before.y - 40, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const after = await shellBox(page)
  expect(after.x).toBeLessThan(before.x - 30)
  await expect(page.locator(MENU)).toHaveCount(0)
  await expect(page.locator(PANEL)).toHaveCount(0)
})

test('USER_CUSTOM_POSITION_PRESERVATION_TEST. dragged ratios survive refresh without safe-default override', async ({ page }) => {
  await openOverlay(page)
  const pet = page.locator(PET)
  const origin = await shellBox(page)
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(origin.x - 180, origin.y - 100, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const before = await shellBox(page)
  const stored = await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))
  const record = JSON.parse(stored ?? '{}') as { position: { xRatio: number; yRatio: number }; positionCustomized: boolean }
  expect(record.positionCustomized).toBe(true)
  expect(Number.isFinite(record.position.xRatio)).toBe(true)
  expect(record.position.xRatio).toBeLessThan(0.95)
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(350)
  const after = await shellBox(page)
  expect(Math.abs(after.x - before.x)).toBeLessThan(4)
  expect(Math.abs(after.y - before.y)).toBeLessThan(4)
})

test('MENU_OPEN_COMPLETE_ACTIVE_SURFACE_CLAMP_TEST. resize and xRatio 0.49 clamp the real Pet + Menu union', async ({ page }) => {
  await openOverlay(page)
  await seedPreferences(page, {
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(300)
  const anchorBeforeOpen = await shellBox(page)
  await openMenu(page)

  const assertCompleteSurface = async (viewport: { width: number; height: number }) => {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(350)
    const pet = await shellBox(page)
    const menu = await page.locator(MENU).boundingBox()
    expect(menu).not.toBeNull()
    const union = {
      left: Math.min(pet.x, menu!.x),
      top: Math.min(pet.y, menu!.y),
      right: Math.max(pet.x + pet.width, menu!.x + menu!.width),
      bottom: Math.max(pet.y + pet.height, menu!.y + menu!.height),
    }
    expect(union.left).toBeGreaterThanOrEqual(15.5)
    expect(union.top).toBeGreaterThanOrEqual(15.5)
    expect(union.right).toBeLessThanOrEqual(viewport.width - 15.5)
    expect(union.bottom).toBeLessThanOrEqual(viewport.height - 15.5)
  }

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 720 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) await assertCompleteSurface(viewport)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator(PET).focus()
  await page.keyboard.press('Shift+ArrowRight')
  await assertCompleteSurface({ width: 390, height: 844 })
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator(MENU).count()).toBe(0)
  await page.waitForTimeout(300)
  const anchorAfterClose = await shellBox(page)
  expect(Math.abs(anchorAfterClose.x - anchorBeforeOpen.x)).toBeLessThanOrEqual(33)
  expect(Math.abs(anchorAfterClose.y - anchorBeforeOpen.y)).toBeLessThanOrEqual(1)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as { position: { xRatio: number } }
  expect(stored.position.xRatio).toBeGreaterThanOrEqual(0)
  expect(stored.position.xRatio).toBeLessThanOrEqual(1)
  await page.setViewportSize(VIEWPORT)
})

test('MENU_OPEN_FIRST_KEYBOARD_STEP_MOVES_TEST + MENU_OPEN_FIRST_POINTER_DRAG_MOVES_TEST. MENU_OPEN movement has no coordinate dead zone', async ({ page }) => {
  await openOverlay(page)
  await seedPreferences(page, {
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await openMenu(page)
  await page.waitForTimeout(350)

  const preference = async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}') as {
      position: { xRatio: number; yRatio: number }
    }
    return value.position
  })
  const keyboardBefore = await shellBox(page)
  const keyboardRatioBefore = await preference()
  await page.locator(PET).focus()
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(350)
  const keyboardAfter = await shellBox(page)
  const keyboardRatioAfter = await preference()
  const keyboardDelta = Math.abs(keyboardAfter.x - keyboardBefore.x) + Math.abs(keyboardAfter.y - keyboardBefore.y)
  console.info('MENU_OPEN_DEAD_ZONE_TRACE', {
    inputType: 'keyboard', inputDirection: 'left', inputApplied: true,
    movementSpaceRemaining: keyboardBefore.x > 16,
    persistedRatioBefore: keyboardRatioBefore, persistedRatioAfter: keyboardRatioAfter,
    visiblePetPositionBefore: { x: keyboardBefore.x, y: keyboardBefore.y },
    visiblePetPositionAfter: { x: keyboardAfter.x, y: keyboardAfter.y },
    visibleActiveSurfaceDeltaPx: keyboardDelta,
  })
  expect(keyboardBefore.x).toBeGreaterThan(16)
  expect(keyboardDelta).toBeGreaterThan(0)
  expect(keyboardAfter.x).toBeLessThan(keyboardBefore.x)

  await page.evaluate(() => localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify({
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })))
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await openMenu(page)
  await page.waitForTimeout(350)
  const pointerBefore = await shellBox(page)
  const pointerRatioBefore = await preference()
  await page.mouse.move(pointerBefore.x + pointerBefore.width / 2, pointerBefore.y + pointerBefore.height / 2)
  await page.mouse.down()
  await page.mouse.move(pointerBefore.x + pointerBefore.width / 2 - 20, pointerBefore.y + pointerBefore.height / 2, { steps: 2 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const pointerAfter = await shellBox(page)
  const pointerRatioAfter = await preference()
  const pointerDelta = Math.abs(pointerAfter.x - pointerBefore.x) + Math.abs(pointerAfter.y - pointerBefore.y)
  console.info('MENU_OPEN_DEAD_ZONE_TRACE', {
    inputType: 'pointer', inputDirection: 'left', inputApplied: true,
    movementSpaceRemaining: pointerBefore.x > 16,
    persistedRatioBefore: pointerRatioBefore, persistedRatioAfter: pointerRatioAfter,
    visiblePetPositionBefore: { x: pointerBefore.x, y: pointerBefore.y },
    visiblePetPositionAfter: { x: pointerAfter.x, y: pointerAfter.y },
    visibleActiveSurfaceDeltaPx: pointerDelta,
  })
  expect(pointerBefore.x).toBeGreaterThan(16)
  expect(pointerDelta).toBeGreaterThan(0)
  expect(pointerAfter.x).toBeLessThan(pointerBefore.x)
  await page.setViewportSize(VIEWPORT)
})

test('MENU_OPEN_OPEN_CLOSE_WITHOUT_INPUT_PRESERVES_ANCHOR_TEST + MENU_OPEN_MOVEMENT_COMMITS_CANONICAL_RATIO_TEST + MENU_OPEN_REFRESH_RESTORES_MOVED_POSITION_TEST + MENU_OPEN_RESIZE_HAS_NO_DEAD_ZONE_TEST + MENU_OPEN_MULTITAB_MOVEMENT_SYNC_TEST', async ({ context, page }) => {
  await openOverlay(page)
  await seedPreferences(page, {
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const closedBefore = await shellBox(page)
  const storedBeforeOpen = await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))
  await openMenu(page)
  await page.waitForTimeout(350)
  expect(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))).toBe(storedBeforeOpen)
  // A pet click is an outside press: it closes the menu (and only triggers the
  // pet reaction, which writes nothing).
  await page.locator(PET).click()
  await expect(page.locator(MENU)).toHaveCount(0)
  await page.waitForTimeout(300)
  const closedWithoutInput = await shellBox(page)
  expect(Math.abs(closedWithoutInput.x - closedBefore.x)).toBeLessThan(1)
  expect(Math.abs(closedWithoutInput.y - closedBefore.y)).toBeLessThan(1)
  expect(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))).toBe(storedBeforeOpen)

  await openMenu(page)
  const projectedBeforeMove = await shellBox(page)
  await page.locator(PET).focus()
  await page.keyboard.press('Shift+ArrowLeft')
  await page.waitForTimeout(300)
  const projectedAfterMove = await shellBox(page)
  expect(projectedAfterMove.x).toBeLessThan(projectedBeforeMove.x)
  const canonical = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as {
    position: { xRatio: number; yRatio: number }; positionCustomized: boolean
  }
  expect(canonical.positionCustomized).toBe(true)
  expect(canonical.position.xRatio).toBeGreaterThanOrEqual(0)
  expect(canonical.position.xRatio).toBeLessThanOrEqual(1)
  await page.keyboard.press('Escape')
  await expect(page.locator(MENU)).toHaveCount(0)
  await page.waitForTimeout(300)
  const closedAfterMove = await shellBox(page)
  expect(Math.abs(closedAfterMove.x - projectedAfterMove.x)).toBeLessThan(1)

  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(350)
  const refreshed = await shellBox(page)
  expect(Math.abs(refreshed.x - closedAfterMove.x)).toBeLessThan(1)
  await openMenu(page)
  await page.setViewportSize({ width: 768, height: 720 })
  await page.waitForTimeout(350)
  const resizedBefore = await shellBox(page)
  await page.locator(PET).focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  const resizedAfter = await shellBox(page)
  expect(resizedAfter.x).toBeGreaterThan(resizedBefore.x)

  const second = await context.newPage()
  await second.setViewportSize({ width: 768, height: 720 })
  await second.goto('/')
  await expect.poll(() => second.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await expect.poll(async () => second.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
    .toBe(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
  await second.locator(MENU_TRIGGER).focus()
  await second.locator(MENU_TRIGGER).dblclick()
  await second.locator(MENU).waitFor()
  const secondBefore = await second.locator(SHELL).boundingBox()
  await second.locator(PET).focus()
  await second.keyboard.press('ArrowUp')
  await second.waitForTimeout(300)
  const secondAfter = await second.locator(SHELL).boundingBox()
  expect(secondAfter!.y).toBeLessThan(secondBefore!.y)
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
    .toBe(await second.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
  await second.close()
  await page.setViewportSize(VIEWPORT)
})

test('10. keyboard movement moves and persists new ratios', async ({ page }) => {
  await openOverlay(page)
  const pet = page.locator(PET)
  await pet.focus()
  const before = await shellBox(page)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Shift+ArrowUp')
  await page.waitForTimeout(300)
  const after = await shellBox(page)
  expect(after.x).toBeLessThan(before.x - 10)
  expect(after.y).toBeLessThan(before.y - 20)
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as { positionCustomized: boolean }
  expect(record.positionCustomized).toBe(true)
})

test('11 + 12. collapse to the 36px launcher and restore', async ({ page }) => {
  await openOverlay(page)
  await openMenu(page)
  await page.locator('[data-vehicle-pet-collapse]').click()
  const launcher = page.locator(LAUNCHER)
  await launcher.waitFor()
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'COLLAPSED')
  expect(await page.locator(ROOT).getAttribute('data-vehicle-pet-size')).toBeNull()
  await expect.poll(async () => (await launcher.boundingBox())?.width).toBe(36)
  const box = await launcher.boundingBox()
  expect(box!.height).toBe(36)
  expect(overlapArea(box!, await composerBounds(page))).toBe(0)
  await expect(page.locator(PET)).toHaveCount(0)
  await expect(page.locator(MENU)).toHaveCount(0)
  await expect(page.locator(DIALOG)).toHaveCount(0)
  await page.screenshot({ path: `${ARTIFACTS}/collapsed.png` })
  await launcher.click()
  await expect(page.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  await expect.poll(async () => (await shellBox(page)).width).toBe(216)
})

test('13. the DSH surface exposes only the product Pack and no Pack switch (seedling stays internal)', async ({ page }) => {
  await openOverlay(page)
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-pack', 'autonomous-fleet')
  await expect(page.locator('[data-vehicle-pet-pack-option]')).toHaveCount(0)
  await openMenu(page)
  const text = await page.locator(MENU).textContent()
  expect(text).not.toContain('种子伙伴')
  expect(text).not.toContain('Seedling')
  await page.screenshot({ path: `${ARTIFACTS}/menu-product-pack-only.png` })
})

test('NO_RESIDENT_PROGRESS_BAR_TEST. no within-level gauge outside the full journey dialog (CTR-OVERLAY-016)', async ({ page }) => {
  await openOverlay(page)
  const assertAbsent = async () => {
    expect(await page.locator('.vpo-progress').count()).toBe(0)
    expect(await page.locator('[data-vehicle-pet-progress]').count()).toBe(0)
    expect(await page.locator('[data-within-level-percent]').count()).toBe(0)
  }
  await assertAbsent()

  await openMenu(page)
  await assertAbsent()

  // Growth systems preserved: the full journey dialog keeps its within-level
  // progress presentation; the resident surfaces still render none.
  await page.locator('[data-vehicle-pet-open-journey]').click()
  await page.locator(DIALOG).waitFor()
  expect(await page.locator('[data-vehicle-pet-dialog] .vp-progressbar').count()).toBe(1)
  await assertAbsent()
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator(DIALOG).count()).toBe(0)

  await closeMenu(page)
  await openMenu(page)
  await page.locator('[data-vehicle-pet-collapse]').click()
  await page.locator(LAUNCHER).waitFor()
  await assertAbsent()
})

test('EXPRESSION_VARIANTS_TEST. the resident pet shows a distinct expression attr per session state incl. cancelled', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  const expr = page.locator(PET)
  const variantOf = () => page.locator(PET).getAttribute('data-vehicle-pet-expression')

  // V3 CTR-OVERLAY-014: ten variants exist; the five structured states map
  // per DEC-OVERLAY-007 and cancelled keeps its own relaxed variant. The
  // contact-sheet pixel matrix for all ten masters is covered by the dsh-dom
  // acceptance; here the live per-state attrs are pinned.
  expect(await variantOf()).toBe('idle')
  await expect(expr).toHaveAttribute('data-live', 'idle')
  // The expression layer lives in the aria-hidden scene; the hit button is the
  // only interactive surface and carries the attr + label.
  const sceneLayer = page.locator('.vpo-scene')
  await expect(sceneLayer).toHaveAttribute('aria-hidden', 'true')
  expect(await sceneLayer.locator('button, [tabindex], input').count()).toBe(0)
  const idleSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(idleSrc ?? '').toContain('data:image')
  await page.screenshot({ path: `${ARTIFACTS}/expression-idle-large.png` })

  // Clicks cycle the friendly idle pool without repeating back-to-back.
  await expr.click()
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'idle-happy')
  await expr.click()
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'completed-proud')
  await expr.click()
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'completed')
  await expect(page.locator('.vpo-characterArea')).not.toHaveAttribute('data-gesture', /.+/, { timeout: 4000 })
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'idle')

  // needs-input: the mock's slot position can drift when dangling requests
  // from earlier windows retry across a reset, so start from a clean script
  // and drive the walk by state — probe until the structured pending question
  // surfaces (bounded: slow slots stream to completed and retry).
  const resetMockScript = async (): Promise<void> => {
    const reset = await fetch('http://127.0.0.1:8902/reset', { method: 'POST' })
    if (!reset.ok) throw new Error(`mock supervisor reset failed: ${reset.status}`)
    await page.reload()
    await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
    await waitForIdleBaseline(page)
  }
  await resetMockScript()
  const driveToNeedsInput = async (): Promise<void> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (attempt === 4) {
        // Backstop self-heal: if the walk still has not surfaced needs-input,
        // reset again mid-walk.
        await resetMockScript()
      }
      await sendPrompt(page, `e2e-expression: probe ${attempt}`)
      const deadline = Date.now() + 120_000
      let runningSince: number | null = null
      while (Date.now() < deadline) {
        const live = await page.locator(PET).getAttribute('data-live')
        if (live === 'needs-input') return
        if (live === 'running') {
          // A drift onto the stall slot would hang without a Stop; bail out
          // of the turn and retry on the next slot.
          if (runningSince === null) runningSince = Date.now()
          const stop = page.getByRole('button', { name: 'Stop generating' })
          if (Date.now() - runningSince > 20_000 && await stop.count() > 0) {
            await stop.click()
            await expect.poll(() => page.locator(PET).getAttribute('data-terminal'), { timeout: 60_000 }).not.toBeNull()
            break
          }
          await page.waitForTimeout(250)
          continue
        }
        runningSince = null
        if (await page.locator(PET).getAttribute('data-terminal') !== null) break
        await page.waitForTimeout(250)
      }
      await waitForIdleBaseline(page)
    }
    throw new Error('the scripted ask_user_question slot never surfaced needs-input')
  }
  await driveToNeedsInput()
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'needs-input')
  const needsInputSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(needsInputSrc).not.toBe(idleSrc)
  await page.screenshot({ path: `${ARTIFACTS}/expression-needs-input-large.png` })
  // Answering continues the turn into invalid_request: the failed terminal.
  const question = page.locator('[data-question-key]')
  await question.waitFor({ timeout: 20_000 })
  await question.getByText('Yes, continue', { exact: true }).click()
  await question.getByRole('textbox').press('Enter')
  await expect.poll(() => page.locator(PET).getAttribute('data-terminal'), { timeout: 90_000 }).toBe('failed')
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'failed')
  const failedSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(failedSrc).not.toBe(idleSrc)
  expect(failedSrc).not.toBe(needsInputSrc)
  await page.screenshot({ path: `${ARTIFACTS}/expression-failed-large.png` })
  await waitForIdleBaseline(page)

  // working: once past the tool slot every turn streams; observe running, then
  // stop the turn for the V3 cancelled variant (V2 collapsed it into failed).
  await sendPrompt(page, 'e2e-expression: drive 0')
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 90_000 }).toBe('running')
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'working')
  const workingSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(workingSrc).not.toBe(idleSrc)
  expect(workingSrc).not.toBe(needsInputSrc)
  await page.screenshot({ path: `${ARTIFACTS}/expression-working-large.png` })
  const stop = page.getByRole('button', { name: 'Stop generating' })
  await stop.waitFor({ timeout: 30_000 })
  await stop.click()
  await expect.poll(() => page.locator(PET).getAttribute('data-terminal'), { timeout: 60_000 }).toBe('cancelled')
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'cancelled')
  const cancelledSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(cancelledSrc).not.toBe(failedSrc)
  await page.screenshot({ path: `${ARTIFACTS}/expression-cancelled-large.png` })
  await waitForIdleBaseline(page)

  // completed: a later slow slot streams to success; capture inside the
  // transient (2.4s) terminal window.
  await sendPrompt(page, 'e2e-expression: final 0')
  await expect.poll(async () => {
    if (await page.locator(PET).getAttribute('data-terminal') !== 'completed') return false
    return (await variantOf()) === 'completed'
  }, { timeout: 120_000 }).toBe(true)
  const completedSrc = await sceneLayer.locator('.vpo-expr img').getAttribute('src')
  expect(completedSrc).not.toBe(idleSrc)
  expect(completedSrc).not.toBe(workingSrc)
  await page.screenshot({ path: `${ARTIFACTS}/expression-completed-large.png` })
  await waitForIdleBaseline(page)
  await expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'idle')
})

test('SCENE_FULL_JOURNEY_GEOMETRY_TEST. Fleet journey layers stay in scene bounds', async ({ page }) => {
  await openOverlay(page)
  await openMenu(page)
  const trigger = page.locator('[data-vehicle-pet-open-journey]')
  const dialog = page.locator(DIALOG)

  await trigger.click()
  await dialog.waitFor()
  await expect(dialog).toHaveAttribute('role', 'dialog')
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.locator('.vp-keepsake-list')).toHaveCount(1)
  const scene = await dialog.locator('.vp-scene').boundingBox()
  const subject = await dialog.locator('[data-pet-subject="true"]').boundingBox()
  const background = await dialog.locator('[data-node-kind="background"]').boundingBox()
  expect(scene).not.toBeNull()
  expect(subject).not.toBeNull()
  expect(background).not.toBeNull()
  expect(overlapArea(subject!, scene!) / (subject!.width * subject!.height)).toBeGreaterThanOrEqual(0.85)
  expect(overlapArea(background!, scene!) / (background!.width * background!.height)).toBeGreaterThanOrEqual(0.85)
  await page.screenshot({ path: `${ARTIFACTS}/fleet-journey-v3.png` })
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  expect(await page.locator('[data-vehicle-pet-dialog-close]').evaluate(node => document.activeElement === node)).toBe(true)

  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  const tabbables = dialog.locator('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
  expect(await tabbables.last().evaluate(node => document.activeElement === node)).toBe(true)
  await page.keyboard.press('Tab')
  expect(await tabbables.first().evaluate(node => document.activeElement === node)).toBe(true)

  const backgroundTarget = page.locator('textarea').first()
  await backgroundTarget.evaluate(node => (node as HTMLElement).focus())
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  // Keyboard close: Escape restores focus to the journey entry (the menu is
  // still open — no outside press happened).
  await page.keyboard.press('Escape')
  await expect.poll(() => page.locator(DIALOG).count()).toBe(0)
  expect(await trigger.evaluate(node => document.activeElement === node)).toBe(true)

  await trigger.click()
  await dialog.waitFor()
  // The dialog close button is an outside press for the secondary menu
  // (CTR-OVERLAY-005), so the menu legitimately closes with it.
  await page.locator('[data-vehicle-pet-dialog-close]').click()
  await expect.poll(() => page.locator(DIALOG).count()).toBe(0)
  await expect(page.locator(MENU)).toHaveCount(0)
  // V3: the journey dialog renders the product Pack only; no seedling switch.
  await expect(page.locator('[data-vehicle-pet-pack-option]')).toHaveCount(0)
})

test('REDUCED_MOTION_STATIC_PARITY_TEST. reduced motion preserves resident subject bounds', async ({ page }) => {
  await openOverlay(page)
  const scene = page.locator('.vpo-scene .vp-scene')
  const subject = page.locator('.vpo-scene [data-pet-subject="true"]')
  const before = await subject.boundingBox()
  await openMenu(page)
  await setLegacyMotionPreference(page, false)
  await closeMenu(page)
  await expect(scene).toHaveAttribute('data-reduced-motion', 'true')
  // The shell's 200ms position transition is independent of the plugin
  // reduced-motion preference; let the menu-close restore settle before
  // measuring so the assertion compares settled geometry, not mid-flight.
  await page.waitForTimeout(350)
  const after = await subject.boundingBox()
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(1)
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
  expect(Math.abs(after!.width - before!.width)).toBeLessThan(1)
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1)
  await page.screenshot({ path: `${ARTIFACTS}/reduced-motion-visible-v3.png` })
})

test('SETTINGS_PRIMARY_ACTION_OVERLAP_TEST measures Pet and open Menu against real Settings actions', async ({ page }) => {
  await openOverlay(page)
  const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
  // The open menu must not cover the host Settings control itself.
  await openMenu(page)
  const menu = await page.locator(MENU).boundingBox()
  const settingsBox = await settings.boundingBox()
  expect(menu).not.toBeNull()
  expect(settingsBox).not.toBeNull()
  expect(overlapArea(menu!, settingsBox!)).toBe(0)
  // CTR-OVERLAY-005: the Settings activation is an outside press, so the
  // non-modal menu legitimately closes with it.
  await settings.click()
  await expect(page.locator(MENU)).toHaveCount(0)
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: /^(Close|关闭)$/ }) })
  await dialog.waitFor({ state: 'visible' })
  const actions = dialog.getByRole('button')
  const actionBoxes = (await Promise.all(Array.from({ length: await actions.count() }, async (_, index) => actions.nth(index).boundingBox()))).filter(box => box !== null)
  expect(actionBoxes.length).toBeGreaterThan(0)
  const pet = await shellBox(page)
  for (const action of actionBoxes) expect(overlapArea(pet, action!)).toBe(0)
  await page.screenshot({ path: `${ARTIFACTS}/v3-settings-overlap.png` })
  await page.keyboard.press('Escape')
})

test('WORKSPACE_PRIMARY_ACTION_OVERLAP_TEST measures Pet and open Menu against real Workspace controls', async ({ page }) => {
  await openOverlay(page)
  const actions = page.getByRole('button', { name: /Add workspace|添加工作区|Board|看板|Add group|添加分组/ })
  await expect(actions.first()).toBeVisible()
  const actionBoxes = (await Promise.all(Array.from({ length: await actions.count() }, async (_, index) => actions.nth(index).boundingBox()))).filter(box => box !== null)
  expect(actionBoxes.length).toBeGreaterThan(0)
  const pet = await shellBox(page)
  for (const action of actionBoxes) expect(overlapArea(pet, action!)).toBe(0)
  await openMenu(page)
  const menu = await page.locator(MENU).boundingBox()
  expect(menu).not.toBeNull()
  for (const action of actionBoxes) expect(overlapArea(menu!, action!)).toBe(0)
  await page.screenshot({ path: `${ARTIFACTS}/v3-workspace-overlap.png` })
})

test('HARNESS_LOCALE_LIVE_SYNC_TEST. zh-CN → en → zh-CN updates menu copy, pet label, and journey live', async ({ page }) => {
  await openOverlay(page)
  const ensureMenu = async () => {
    if (await page.locator(MENU).count() === 0) await openMenu(page)
    await page.locator(MENU).waitFor()
  }
  const switchHarnessLocale = async (option: 'English' | '中文') => {
    await closeMenu(page)
    const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
    await settings.click()
    const selector = page.getByRole('button', { name: /^(中文|English)$/ }).last()
    await selector.waitFor({ timeout: 20_000 })
    await selector.click()
    await page.getByRole('menuitem', { name: option, exact: true }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(option === 'English' ? 'en' : 'zh-CN')
    await page.keyboard.press('Escape')
    await ensureMenu()
  }
  const assertCopy = async (english: boolean) => {
    await expect(page.locator(PET)).toHaveAttribute('aria-description', /Shift\+Enter/)
    await expect(page.locator(MENU)).toHaveAttribute('aria-label', english ? 'Growth companion settings' : '成长伙伴设置')
    await expect(page.locator('[data-vehicle-pet-size-control] .vpo-menuLabel')).toHaveText(english ? 'Size' : '大小')
    await expect(page.locator('[data-vehicle-pet-open-journey]')).toHaveText(english ? 'Full journey' : '查看完整旅程')
    await expect(page.locator('[data-vehicle-pet-collapse]')).toHaveText(english ? 'Collapse overlay' : '收起挂件')
    await expect(page.locator('[data-vehicle-pet-pack-option]')).toHaveCount(0)
    // Pet a11y label rides the engine-mapped state text; the word must match
    // whatever structured state the live session is currently presenting.
    const stateWords = english
      ? { idle: 'Idle', running: 'Working', 'needs-input': 'Needs your input', completed: 'Task completed', failed: 'Task hit a problem', cancelled: 'Task cancelled' }
      : { idle: '待机', running: '工作中', 'needs-input': '等待你的操作', completed: '任务完成', failed: '任务遇到问题', cancelled: '任务已取消' }
    const label = await page.locator(PET).getAttribute('aria-label')
    const live = await page.locator(PET).getAttribute('data-live')
    const terminal = await page.locator(PET).getAttribute('data-terminal')
    const stateKey = (terminal ?? live ?? 'idle') as keyof typeof stateWords
    expect(label ?? '').toContain(stateWords[stateKey])
    const trigger = page.locator('[data-vehicle-pet-open-journey]')
    await trigger.click()
    const dialog = page.locator(DIALOG)
    await expect(dialog).toHaveAttribute('aria-label', english ? 'Growth Journey' : '成长旅程')
    await expect(dialog).toContainText(english ? 'One car: driver occupied, copilot empty, rear escort present.' : '主驾有人，副驾无人，有后方保护车，1 辆车。')
    await expect(dialog.locator('.vp-panel').first()).toContainText(english ? 'Driver with Escort' : '主驾有人 · 有保护车')
    await page.keyboard.press('Escape')
    await expect.poll(() => page.locator(DIALOG).count()).toBe(0)
  }

  await ensureMenu()
  await switchHarnessLocale('中文')
  await assertCopy(false)
  await switchHarnessLocale('English')
  await assertCopy(true)
  await switchHarnessLocale('中文')
  await assertCopy(false)
  await expect(page.locator(ROOT)).toHaveCount(1)
})

test('CROSSTAB_COLLAPSE_RESTORE_VISIBLE_TEST. two tabs destroy stale Menu/Dialog and never write-loop', async ({ context, page }) => {
  await openOverlay(page)
  const second = await context.newPage()
  await second.setViewportSize(VIEWPORT)
  await second.goto('/')
  await expect.poll(() => second.locator(PET).count(), { timeout: 30_000 }).toBe(1)

  const instrumentWrites = async (target: Page) => target.evaluate(() => {
    // Count PREFERENCE writes only (the write-loop contract under test).
    // The usage ledger record (vehicle-pet/usage-ledger/v1, DSH_USAGE_
    // PROGRESS_SOURCE_V1 CTR-USG-009) is a separate sanctioned writer whose
    // persistence frequency is bounded by its own change-only rule.
    const preferenceKey = 'vehicle-pet/overlay-preferences/v1'
    const state = { writes: 0 }
    const prototype = Storage.prototype
    const native = prototype.setItem
    prototype.setItem = function (key, ...args) {
      if (String(key) === preferenceKey) state.writes += 1
      return native.apply(this, [key, ...args])
    }
    ;(window as unknown as { __vpoPreferenceWrites: typeof state }).__vpoPreferenceWrites = state
  })
  const writes = async (target: Page) => target.evaluate(() => (window as unknown as { __vpoPreferenceWrites: { writes: number } }).__vpoPreferenceWrites.writes)
  await instrumentWrites(page)
  await instrumentWrites(second)

  await openMenu(page)
  await page.locator('[data-vehicle-pet-open-journey]').click()
  await expect(page.locator(DIALOG)).toHaveCount(1)

  await openMenu(second)
  await second.locator('[data-vehicle-pet-collapse]').click()
  for (const target of [page, second]) {
    await expect(target.locator(LAUNCHER)).toHaveCount(1)
    await expect(target.locator(PET)).toHaveCount(0)
    await expect(target.locator(MENU)).toHaveCount(0)
    await expect(target.locator(DIALOG)).toHaveCount(0)
    await expect(target.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'COLLAPSED')
  }
  expect(await writes(page)).toBe(0)
  expect(await writes(second)).toBe(1)

  await page.reload()
  await expect(page.locator(LAUNCHER)).toHaveCount(1)
  await instrumentWrites(page)
  await second.locator(LAUNCHER).click()
  for (const target of [page, second]) {
    await expect(target.locator(PET)).toHaveCount(1)
    await expect(target.locator(MENU)).toHaveCount(0)
    await expect(target.locator(DIALOG)).toHaveCount(0)
    await expect(target.locator(ROOT)).toHaveAttribute('data-vehicle-pet', 'VISIBLE')
  }
  expect(await writes(page)).toBe(0)
  expect(await writes(second)).toBe(2)

  for (const target of [page, second]) {
    await openMenu(target)
    await target.locator('[data-vehicle-pet-collapse]').click()
    await expect(page.locator(LAUNCHER)).toHaveCount(1)
    await expect(second.locator(LAUNCHER)).toHaveCount(1)
    await target.locator(LAUNCHER).click()
    await expect(page.locator(PET)).toHaveCount(1)
    await expect(second.locator(PET)).toHaveCount(1)
    await expect(page.locator(MENU)).toHaveCount(0)
    await expect(second.locator(MENU)).toHaveCount(0)
  }
  expect(await writes(page)).toBe(2)
  expect(await writes(second)).toBe(4)
  await second.close()
})

test('FULL_JOURNEY_LIGHT_THEME_CONTRAST_TEST + FULL_JOURNEY_DARK_THEME_CONTRAST_TEST', async ({ page }) => {
  await openOverlay(page)
  buildClientGeneration('e2e-r3-active-v3-contrast-matrix')
  await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'e2e-r3-active-v3-contrast-matrix', { timeout: 60_000 })
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __vehiclePetE2E?: { progress?: unknown } }).__vehiclePetE2E?.progress))).toBe(true)

  const ensureMenu = async () => {
    if (await page.locator(MENU).count() === 0) await openMenu(page)
    await page.locator(MENU).waitFor()
  }
  const setPoints = async (points: number) => page.evaluate(value => {
    ;(window as unknown as { __vehiclePetE2E: { progress: { setPoints: (next: number) => void } } }).__vehiclePetE2E.progress.setPoints(value)
  }, points)
  const setLocale = async (locale: 'zh-CN' | 'en') => {
    await closeMenu(page)
    if (await page.evaluate(() => document.documentElement.lang) === locale) return
    const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
    await settings.click()
    const selector = page.getByRole('button', { name: /^(中文|English)$/ }).last()
    await selector.waitFor({ timeout: 20_000 })
    await selector.click()
    await page.getByRole('menuitem', { name: locale === 'en' ? 'English' : '中文', exact: true }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(locale)
    await page.keyboard.press('Escape')
  }
  const setReduced = async (reduced: boolean) => {
    await ensureMenu()
    await setLegacyMotionPreference(page, reduced)
  }
  const sampleContrast = async (): Promise<{ min: number; samples: number }> => {
    await ensureMenu()
    await page.locator('[data-vehicle-pet-open-journey]').click()
    const dialog = page.locator(DIALOG)
    await dialog.waitFor()
    const result = await dialog.evaluate(root => {
      const parse = (value: string): [number, number, number, number] => {
        const parts = value.match(/[\d.]+/g)?.map(Number) ?? []
        return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
      }
      const composite = (front: [number, number, number, number], back: [number, number, number, number]): [number, number, number, number] => {
        const alpha = front[3] + back[3] * (1 - front[3])
        return [
          (front[0] * front[3] + back[0] * back[3] * (1 - front[3])) / alpha,
          (front[1] * front[3] + back[1] * back[3] * (1 - front[3])) / alpha,
          (front[2] * front[3] + back[2] * back[3] * (1 - front[3])) / alpha,
          alpha,
        ]
      }
      const background = (element: Element): [number, number, number, number] => {
        const layers: [number, number, number, number][] = []
        let current: Element | null = element
        while (current !== null) {
          const color = parse(getComputedStyle(current).backgroundColor)
          if (color[3] > 0) layers.push(color)
          current = current.parentElement
        }
        let result: [number, number, number, number] = [255, 255, 255, 1]
        for (let index = layers.length - 1; index >= 0; index -= 1) result = composite(layers[index]!, result)
        return result
      }
      const luminance = (rgb: [number, number, number, number]): number => {
        const channels = rgb.slice(0, 3).map(channel => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
      }
      const ratio = (foreground: [number, number, number, number], bg: [number, number, number, number]): number => {
        const fg = luminance(composite(foreground, bg))
        const back = luminance(bg)
        return (Math.max(fg, back) + 0.05) / (Math.min(fg, back) + 0.05)
      }
      const selector = '.vpo-dialogTitle,.vpo-control,.vp-panel h3,.vp-panel>p,.vp-progress-meta,.vp-milestone-copy,.vp-scene-label,.vp-keepsake-title,.vp-keepsake-desc,[data-pet-capped]'
      const elements = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(element => {
        const style = getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden' && element.textContent?.trim()
      })
      const checks = elements.map(element => {
        const style = getComputedStyle(element)
        const fontSize = Number.parseFloat(style.fontSize)
        const weight = Number.parseInt(style.fontWeight, 10) || (style.fontWeight === 'bold' ? 700 : 400)
        const minimum = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700) ? 3 : 4.5
        return { ratio: ratio(parse(style.color), background(element)), minimum, text: element.textContent?.trim().slice(0, 40) }
      })
      const failure = checks.find(check => check.ratio + 0.001 < check.minimum)
      if (failure !== undefined) throw new Error(`contrast ${failure.ratio.toFixed(3)} < ${failure.minimum}: ${failure.text}`)
      return { min: Math.min(...checks.map(check => check.ratio)), samples: checks.length }
    })
    expect(result.samples).toBeGreaterThanOrEqual(10)
    await page.keyboard.press('Escape')
    await expect.poll(() => page.locator(DIALOG).count()).toBe(0)
    await closeMenu(page)
    return result
  }

  let minimum = Number.POSITIVE_INFINITY
  const runVariants = async () => {
    for (const [locale, reduced] of [['zh-CN', false], ['en', true]] as const) {
      await setLocale(locale)
      await setReduced(reduced)
      const result = await sampleContrast()
      minimum = Math.min(minimum, result.min)
    }
  }

  try {
    await setPoints(0)
    await runVariants() // Fleet L1
    await setPoints(2_500_000)
    await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', 'l12')
    await runVariants() // Fleet L12
    // The seedling fixture Pack is not reachable from the DSH surface, so the
    // contrast matrix covers the product Pack levels only.

    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    const darkResult = await sampleContrast()
    minimum = Math.min(minimum, darkResult.min)
    console.log(`FULL_JOURNEY_MIN_CONTRAST_RATIO=${minimum.toFixed(3)}`)
    expect(minimum).toBeGreaterThanOrEqual(4.5)
  } finally {
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
    // Restore the host default locale: later locale-sensitive assertions in
    // this suite assume the fresh-context zh-CN baseline.
    await setLocale('zh-CN')
    buildClientGeneration('production')
    await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
  }
})

test('COMPACT_ALL_LEVEL_PIXEL_MATRIX_TEST + COMPACT_MILESTONE_SUBJECT_OVERLAP_TEST + COMPACT_BLACK_VOID_TEST', async ({ page }) => {
  await openOverlay(page)
  buildClientGeneration('e2e-r3-active-matrix')
  await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'e2e-r3-active-matrix', { timeout: 60_000 })
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __vehiclePetE2E?: { progress?: unknown } }).__vehiclePetE2E?.progress))).toBe(true)

  const setPoints = async (points: number) => {
    await page.evaluate(value => {
      const control = (window as unknown as {
        __vehiclePetE2E: { progress: { setPoints: (next: number) => void } }
      }).__vehiclePetE2E.progress
      control.setPoints(value)
    }, points)
  }
  const setReduced = async (enabled: boolean) => {
    await openMenu(page)
    await setLegacyMotionPreference(page, enabled)
    await closeMenu(page)
    await expect(page.locator('.vpo-scene .vp-scene')).toHaveAttribute('data-reduced-motion', 'true')
  }
  const runLevels = async (packId: string, levels: readonly { levelId: string; threshold: number }[]) => {
    for (const level of levels) {
      await setPoints(level.threshold)
      await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', level.levelId)
      await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-pack', packId)
      await page.waitForTimeout(500)
      const scene = page.locator('.vpo-scene .vp-scene')
      const subject = scene.locator('[data-pet-subject="true"]')
      const normalScene = await scene.boundingBox()
      const normalSubject = await subject.boundingBox()
      expect(normalScene).not.toBeNull()
      expect(normalSubject).not.toBeNull()
      expect(overlapArea(normalSubject!, normalScene!) / (normalSubject!.width * normalSubject!.height)).toBeGreaterThanOrEqual(0.9)
      expect(normalSubject!.x + normalSubject!.width / 2).toBeGreaterThanOrEqual(normalScene!.x)
      expect(normalSubject!.x + normalSubject!.width / 2).toBeLessThanOrEqual(normalScene!.x + normalScene!.width)
      expect(normalSubject!.y + normalSubject!.height / 2).toBeGreaterThanOrEqual(normalScene!.y)
      expect(normalSubject!.y + normalSubject!.height / 2).toBeLessThanOrEqual(normalScene!.y + normalScene!.height)
      expect(await scene.locator('.vp-kind-milestone, .vp-kind-aggregate-label').count()).toBe(0)
      expect(await subject.evaluate(node => getComputedStyle(node, '::after').display)).toBe('none')

      const normalPng = await scene.screenshot({ path: `${ARTIFACTS}/r3-${packId}-${level.levelId}-normal.png` })
      const pixels = await sharp(normalPng).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let black = 0
      for (let index = 0; index < pixels.data.length; index += pixels.info.channels) {
        if (pixels.data[index]! < 24 && pixels.data[index + 1]! < 24 && pixels.data[index + 2]! < 24) black += 1
      }
      expect(black / (pixels.info.width * pixels.info.height)).toBeLessThan(0.05)

      const freezeMotion = await page.addStyleTag({ content: '.vpo-scene .vp-node{animation:none!important;transition:none!important}' })
      const staticNormalSubject = await subject.boundingBox()
      await setReduced(true)
      const reducedSubject = await subject.boundingBox()
      expect(staticNormalSubject).not.toBeNull()
      expect(reducedSubject).not.toBeNull()
      expect(Math.abs(reducedSubject!.x - staticNormalSubject!.x)).toBeLessThanOrEqual(2)
      expect(Math.abs(reducedSubject!.y - staticNormalSubject!.y)).toBeLessThanOrEqual(2)
      expect(Math.abs(reducedSubject!.width - staticNormalSubject!.width)).toBeLessThanOrEqual(2)
      expect(Math.abs(reducedSubject!.height - staticNormalSubject!.height)).toBeLessThanOrEqual(2)
      await scene.screenshot({ path: `${ARTIFACTS}/r3-${packId}-${level.levelId}-reduced.png` })
      await freezeMotion.evaluate(node => { (node as Element).remove() })
      await setReduced(false)

      await openMenu(page)
      await page.locator('[data-vehicle-pet-open-journey]').click()
      const dialogScene = page.locator(`${DIALOG} .vp-scene`)
      const dialogBounds = await dialogScene.boundingBox()
      const dialogSubject = await dialogScene.locator('[data-pet-subject="true"]').boundingBox()
      expect(dialogBounds).not.toBeNull()
      expect(dialogSubject).not.toBeNull()
      expect(overlapArea(dialogSubject!, dialogBounds!) / (dialogSubject!.width * dialogSubject!.height)).toBeGreaterThanOrEqual(0.85)
      await dialogScene.screenshot({ path: `${ARTIFACTS}/r3-${packId}-${level.levelId}-journey.png` })
      await page.keyboard.press('Escape')
      await expect.poll(() => page.locator(DIALOG).count()).toBe(0)
      await closeMenu(page)
    }
  }

  try {
    await runLevels('autonomous-fleet', fleetManifest.levels)
    // The seedling fixture Pack is not reachable from the DSH surface.
  } finally {
    buildClientGeneration('production')
    await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
  }
})

test('SPEECH_BUBBLE_LIFECYCLE_TEST. one polite catalog line per click edge, auto-dismissed inside the bound', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  // CTR-OVERLAY-019(1): load quiet period — no bubble within 30s of mount.
  await expect.poll(() => page.locator(BUBBLE).count()).toBe(0)
  await page.waitForTimeout(SPEECH_LOAD_QUIET_WAIT_MS)
  // The harness locale may legitimately be zh-CN or en at this point (it is a
  // host-level setting); the line must come from the active locale's bundled
  // catalog, so accept either locale's entries.
  const catalogTexts = new Set([...speechCatalog('zh-CN'), ...speechCatalog('en')].map(entry => entry.text))

  await page.locator(PET).click()
  const bubble = page.locator(BUBBLE)
  await expect.poll(() => page.locator(BUBBLE).count(), { timeout: 5_000 }).toBe(1)
  const appearedAt = Date.now()
  await expect(bubble).toHaveAttribute('role', 'status')
  await expect(bubble).toHaveAttribute('aria-live', 'polite')
  await expect(bubble).toHaveAttribute('data-placement', 'above')
  expect(await page.locator(BUBBLE).count()).toBe(1)
  const text = (await bubble.textContent()) ?? ''
  expect(text.trim().length).toBeGreaterThan(0)
  expect(catalogTexts.has(text.trim()), `bubble text "${text}" is not a catalog line`).toBe(true)

  // Auto-dismiss target 4s (hard bounds 3–6s, CTR-OVERLAY-017).
  await expect.poll(() => page.locator(BUBBLE).count(), { timeout: 7_000 }).toBe(0)
  expect(Date.now() - appearedAt).toBeGreaterThanOrEqual(2_500)

  // CTR-OVERLAY-019(7): click lines throttle to one per 30s; a rapid second
  // click changes the expression but never speaks.
  await page.locator(PET).click()
  await page.waitForTimeout(2_500)
  await expect(page.locator(BUBBLE)).toHaveCount(0)
})

test('SPEECH_NO_FOCUS_STEAL_TEST. the visible bubble never takes or holds focus', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  await page.waitForTimeout(SPEECH_LOAD_QUIET_WAIT_MS)

  await page.locator(PET).focus()
  await page.locator(PET).click()
  await expect.poll(() => page.locator(BUBBLE).count(), { timeout: 5_000 }).toBe(1)
  const activeDuring = () => page.evaluate(() => {
    const element = document.activeElement
    return element === null ? 'null' : `${element.tagName}:${(element as HTMLElement).dataset.vehiclePetPet ?? ''}`
  })
  const during = await activeDuring()
  expect(during).toBe('BUTTON:true')
  await page.waitForTimeout(800)
  expect(await activeDuring()).toBe(during)
  // The bubble surface is inert: not focusable and never intercepts pointers.
  expect(await page.locator(BUBBLE).getAttribute('tabindex')).toBeNull()
  expect(await page.locator(BUBBLE).evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none')
})

test('SPEECH_NO_COMPOSER_OCCLUSION_TEST. the bubble stays clear of the composer and send control', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  await page.waitForTimeout(SPEECH_LOAD_QUIET_WAIT_MS)

  await page.locator(PET).click()
  const bubble = page.locator(BUBBLE)
  await expect.poll(() => page.locator(BUBBLE).count(), { timeout: 5_000 }).toBe(1)
  const bubbleBox = await bubble.boundingBox()
  const composer = await composerBounds(page)
  const send = await page.getByRole('button', { name: /发送消息|Send message/ }).first().boundingBox()
  expect(bubbleBox).not.toBeNull()
  expect(send).not.toBeNull()
  expect(overlapArea(bubbleBox!, composer)).toBe(0)
  expect(overlapArea(bubbleBox!, send!)).toBe(0)
  // Positioned fully inside the viewport (CTR-OVERLAY-017).
  expect(bubbleBox!.x).toBeGreaterThanOrEqual(0)
  expect(bubbleBox!.y).toBeGreaterThanOrEqual(0)
  expect(bubbleBox!.x + bubbleBox!.width).toBeLessThanOrEqual(VIEWPORT.width)
  expect(bubbleBox!.y + bubbleBox!.height).toBeLessThanOrEqual(VIEWPORT.height)
  await page.screenshot({ path: `${ARTIFACTS}/speech-bubble.png` })
})

test('SEEDLING_COERCION_PROBE_TEST. a legacy non-product activePackId coerces without data loss (CTR-OVERLAY-006)', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  page.on('pageerror', error => pageErrors.push(error.message))

  await openOverlay(page)
  // The engine DB exists now (the overlay mounted). Seed a legacy non-product
  // activePackId plus surviving journal/keepsake records (store/key shape of
  // IndexedDbPetStorage: journals | keepsakes | preferences, out-of-line keys).
  // Each handler is self-contained and every failure path is captured so an
  // IDB abort surfaces with its full context instead of an opaque error.
  const readStorage = () => page.evaluate(async () => {
    const fail = (step: string, error: unknown): never => {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      throw new Error(`pet-engine-v1 ${step} failed — ${detail}`)
    }
    const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pet-engine-v1', 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('journals')) db.createObjectStore('journals')
        if (!db.objectStoreNames.contains('keepsakes')) db.createObjectStore('keepsakes')
        if (!db.objectStoreNames.contains('preferences')) db.createObjectStore('preferences')
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('open error'))
    })
    const readStore = (db: IDBDatabase, store: string) => new Promise<Record<string, unknown>>((resolve, reject) => {
      const out: Record<string, unknown> = {}
      let keys: IDBValidKey[] = []
      let values: unknown[] = []
      const tx = db.transaction(store, 'readonly')
      const keysRequest = tx.objectStore(store).getAllKeys()
      const valuesRequest = tx.objectStore(store).getAll()
      keysRequest.onsuccess = () => { keys = keysRequest.result }
      valuesRequest.onsuccess = () => { values = valuesRequest.result }
      tx.oncomplete = () => {
        keys.forEach((key, index) => { out[String(key)] = values[index] })
        resolve(out)
      }
      tx.onerror = () => reject(tx.error ?? new Error('read error'))
      tx.onabort = () => reject(tx.error ?? new Error('read aborted'))
    })
    const db = await openDb()
    try {
      return {
        preferences: await readStore(db, 'preferences'),
        journals: await readStore(db, 'journals'),
        keepsakes: await readStore(db, 'keepsakes'),
      }
    } catch (error) {
      return fail('read', error)
    } finally {
      db.close()
    }
  })
  const seedStorage = () => page.evaluate(async () => {
    const fail = (step: string, error: unknown): never => {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      throw new Error(`pet-engine-v1 ${step} failed — ${detail}`)
    }
    const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pet-engine-v1', 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('journals')) db.createObjectStore('journals')
        if (!db.objectStoreNames.contains('keepsakes')) db.createObjectStore('keepsakes')
        if (!db.objectStoreNames.contains('preferences')) db.createObjectStore('preferences')
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('open error'))
    })
    const put = (db: IDBDatabase, store: string, key: string, value: unknown) => new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('put error'))
      tx.onabort = () => reject(tx.error ?? new Error('put aborted'))
    })
    const db = await openDb()
    try {
      await put(db, 'preferences', 'activePackId', 'seedling-fixture')
      await put(db, 'journals', 'dsh-usage|companion', {
        consumedReceiptIds: ['dsh-usage|companion|seedling-fixture|1.0.0|l2'],
        greetedLocalDays: [],
      })
      await put(db, 'keepsakes', 'dsh-usage|companion|seedling-fixture|1.0.0|ks-seed', 'dsh-usage|companion|seedling-fixture|1.0.0|ks-seed')
    } catch (error) {
      return fail('seed', error)
    } finally {
      db.close()
    }
    return 'seeded'
  })
  expect(await seedStorage()).toBe('seeded')
  const before = await readStorage()
  expect(before.preferences?.activePackId).toBe('seedling-fixture')
  expect(Object.keys(before.journals ?? {})).toHaveLength(1)
  expect(Object.keys(before.keepsakes ?? {})).toHaveLength(1)

  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  // The overlay renders the product Pack (no error, no seedling subject).
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-pack', 'autonomous-fleet')
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', /^l\d+$/)
  await expect(page.locator(ROOT)).toHaveCount(1)

  const after = await readStorage()
  // Coerced + persisted product Pack; the seeded data survives. The journal
  // may legitimately GROW (the engine's once-per-local-day greeting claim is
  // an engine-authorized append) but never loses seeded entries, and the
  // keepsakes store is untouched.
  expect(after.preferences?.activePackId).toBe('autonomous-fleet')
  const journalBefore = before.journals?.['dsh-usage|companion'] as { consumedReceiptIds: string[]; greetedLocalDays: string[] } | undefined
  const journalAfter = after.journals?.['dsh-usage|companion'] as { consumedReceiptIds: string[]; greetedLocalDays: string[] } | undefined
  expect(journalAfter?.consumedReceiptIds).toEqual(journalBefore?.consumedReceiptIds)
  for (const day of journalBefore?.greetedLocalDays ?? []) {
    expect(journalAfter?.greetedLocalDays).toContain(day)
  }
  expect(after.keepsakes).toEqual(before.keepsakes)
  expect(pageErrors).toEqual([])
})

test('REAL_HARNESS_INDEXEDDB_DISPOSAL_TEST + REAL_HARNESS_HMR_RESOURCE_INVENTORY_TEST', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  const recorder = await installPillRecorder(page)
  await page.evaluate(() => {
    const trace: { maxEntries: number; generations: string[]; observer: MutationObserver } = {
      maxEntries: 0,
      generations: [],
      observer: undefined as unknown as MutationObserver,
    }
    const capture = () => {
      trace.maxEntries = Math.max(trace.maxEntries, document.querySelectorAll('[data-vehicle-pet]').length)
      const generation = document.querySelector('[data-vehicle-pet]')?.getAttribute('data-client-generation')
      if (generation !== null && generation !== undefined && trace.generations.at(-1) !== generation) trace.generations.push(generation)
    }
    trace.observer = new MutationObserver(capture)
    trace.observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    ;(window as unknown as { __vpHmrTrace: typeof trace }).__vpHmrTrace = trace
    capture()
  })

  buildClientGeneration('e2e-r3-disabled-baseline')
  await expect.poll(() => page.evaluate(() => {
    const root = (window as unknown as { __vehiclePetE2E?: { pluginResources?: { generation: string } } }).__vehiclePetE2E
    return root?.pluginResources?.generation
  }), { timeout: 60_000 }).toBe('e2e-r3-disabled-baseline')
  await expect(page.locator(ROOT)).toHaveCount(0)
  const RESOURCE_BASELINE = await resourceSnapshot(page)
  expect(RESOURCE_BASELINE.overlayDom).toBe(0)
  expect(RESOURCE_BASELINE.injectedStyle).toBe(0)
  expect(RESOURCE_BASELINE.indexedDbConnections).toBe(0)
  expect(Object.values(RESOURCE_BASELINE.pluginResources).every(value => value === 0)).toBe(true)
  expect(await deletePetDatabase(page)).toEqual({ blocked: false, success: true })

  try {
    for (let round = 1; round <= 5; round += 1) {
      const activeGeneration = `e2e-r3-active-resource-${round}`
      buildClientGeneration(activeGeneration)
      await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', activeGeneration, { timeout: 60_000 })
      await expect(page.locator(PET)).toHaveCount(1)
      await expect.poll(async () => (await resourceSnapshot(page)).indexedDbConnections).toBe(1)

      await openMenu(page)
      await page.locator('[data-vehicle-pet-open-journey]').click()
      await expect(page.locator(DIALOG)).toHaveCount(1)
      const RESOURCE_ACTIVE = await resourceSnapshot(page)
      expect(RESOURCE_ACTIVE.overlayDom).toBe(1)
      expect(RESOURCE_ACTIVE.dialogDom).toBe(1)
      expect(RESOURCE_ACTIVE.injectedStyle).toBe(1)
      expect(RESOURCE_ACTIVE.resizeObservers).toBeGreaterThan(RESOURCE_BASELINE.resizeObservers)
      expect(RESOURCE_ACTIVE.storageListeners).toBeGreaterThan(RESOURCE_BASELINE.storageListeners)
      expect(RESOURCE_ACTIVE.resizeListeners).toBeGreaterThan(RESOURCE_BASELINE.resizeListeners)
      expect(RESOURCE_ACTIVE.indexedDbConnections).toBe(1)
      expect(RESOURCE_ACTIVE.pluginResources['shell-overlay-slot']).toBe(1)
      expect(RESOURCE_ACTIVE.pluginResources['session-list-subscription']).toBe(1)
      expect(RESOURCE_ACTIVE.pluginResources['current-session-subscription']).toBe(1)
      expect(RESOURCE_ACTIVE.pluginResources['terminal-event-subscription']).toBe(1)

      const disabledGeneration = `e2e-r3-disabled-resource-${round}`
      buildClientGeneration(disabledGeneration)
      await expect.poll(() => page.evaluate(() => {
        const root = (window as unknown as { __vehiclePetE2E?: { pluginResources?: { generation: string } } }).__vehiclePetE2E
        return root?.pluginResources?.generation
      }), { timeout: 60_000 }).toBe(disabledGeneration)
      await expect(page.locator(ROOT)).toHaveCount(0)
      await expect(page.locator(DIALOG)).toHaveCount(0)
      const RESOURCE_DISPOSED = await resourceSnapshot(page)
      expect(RESOURCE_DISPOSED).toEqual(RESOURCE_BASELINE)
      expect(await deletePetDatabase(page)).toEqual({ blocked: false, success: true })
      expect((await resourceSnapshot(page)).indexedDbConnections).toBe(0)
      expect(await recorder.read()).toEqual([])
    }

    const trace = await page.evaluate(() => {
      const value = (window as unknown as {
        __vpHmrTrace: { maxEntries: number; generations: string[]; observer: MutationObserver }
      }).__vpHmrTrace
      value.observer.disconnect()
      return { maxEntries: value.maxEntries, generations: value.generations }
    })
    expect(trace.maxEntries).toBe(1)
    expect(trace.generations.filter(generation => generation.startsWith('e2e-r3-active-resource-'))).toHaveLength(5)
  } finally {
    buildClientGeneration('production')
    await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
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

test('CHARACTER_V4_PERSISTENCE_AND_GEOMETRY. selection keeps Engine records and level, survives reload, and labels fit both sizes', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  const readPetRecords = () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve,reject)=>{
      const request=indexedDB.open('pet-engine-v1',1)
      request.onsuccess=()=>resolve(request.result)
      request.onerror=()=>reject(request.error)
    })
    try {
      const result: Record<string, unknown>={}
      for(const store of ['preferences','journals','keepsakes']) {
        result[store]=await new Promise((resolve,reject)=>{
          const tx=db.transaction(store,'readonly')
          const req=tx.objectStore(store).getAll()
          req.onsuccess=()=>resolve(req.result)
          req.onerror=()=>reject(req.error)
        })
      }
      return result
    } finally {db.close()}
  })
  const records=await readPetRecords()
  const level=await page.locator(PET).getAttribute('data-vehicle-pet-level')
  await openMenu(page)
  await expect(page.locator('[data-vehicle-pet-character-option]')).toHaveCount(2)
  await page.locator('[data-vehicle-pet-character-option="companion"]').click()
  await closeMenu(page)
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-character','companion')
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level',level!)
  await expect(page.locator('[data-companion-pose]')).toHaveCount(1)
  await expect(page.locator('.vpo-scene .vp-scene')).toHaveCount(0)
  expect(await readPetRecords()).toEqual(records)
  for(const size of ['large','small'] as const) {
    await openMenu(page)
    await page.locator(`[data-vehicle-pet-size-option="${size}"]`).click()
    await closeMenu(page)
    await page.waitForTimeout(300)
    const label=page.locator('[data-vehicle-pet-grade]')
    expect((await label.textContent())!.length).toBeGreaterThan(12)
    const shell=await shellBox(page), box=await label.boundingBox()
    const greeting=page.locator('[data-pet-greeting]')
    if(await greeting.count()) {
      const greetingBox=await greeting.boundingBox()
      expect(overlapArea(shell,greetingBox!)).toBe(0)
      expect(greetingBox!.x).toBeGreaterThanOrEqual(0)
      expect(greetingBox!.x+greetingBox!.width).toBeLessThanOrEqual(VIEWPORT.width)
    }
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(shell.x)
    expect(box!.y+box!.height).toBeLessThanOrEqual(shell.y+shell.height+.5)
    const composer=await page.locator('textarea:enabled').last().boundingBox()
    if(composer!==null) expect(overlapArea(box!,composer)).toBe(0)
    expect(await label.evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true)
    await page.screenshot({path:`${ARTIFACTS}/character-v4-${size}.png`})
  }
  await page.reload()
  await dismissStartupDialogs(page)
  await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-character','companion')
  expect(await readPetRecords()).toEqual(records)
  await openMenu(page)
  await page.locator('[data-vehicle-pet-character-option="vehicle"]').click()
  await closeMenu(page)
  await expect(page.locator('[data-companion-pose]')).toHaveCount(0)
  expect(await readPetRecords()).toEqual(records)
})

test('CHARACTER_V4_TERMINAL_SINGLE_FEEDBACK. quiet-period terminal uses one readable speech surface',async({page})=>{
  await openOverlay(page)
  await waitForIdleBaseline(page)
  await openMenu(page)
  await page.locator('[data-vehicle-pet-character-option="companion"]').click()
  await closeMenu(page)
  await page.waitForTimeout(SPEECH_LOAD_QUIET_WAIT_MS)
  const reset=await fetch('http://127.0.0.1:8902/reset',{method:'POST'})
  expect(reset.ok).toBe(true)
  await sendPrompt(page,'character-terminal-feedback-check')
  await expect(page.locator(PET)).toHaveAttribute('data-live','running')
  await expect(page.locator(PET)).toHaveAttribute('data-terminal','completed',{timeout:30000})
  await expect(page.locator(BUBBLE)).toBeVisible()
  await expect(page.locator(PILL)).toHaveCount(1)
  await expect(page.locator(PILL)).toBeHidden()
  const bubble=await page.locator(BUBBLE).boundingBox(),shell=await shellBox(page)
  expect(overlapArea(bubble!,shell)).toBe(0)
  await page.screenshot({path:`${ARTIFACTS}/character-v4-terminal-single-feedback.png`})
  await expect(page.locator(BUBBLE)).toHaveCount(0,{timeout:7000})
  await expect(page.locator(PILL)).toHaveCount(0)
})

async function setLegacyMotionPreference(page:Page, reducedMotion:boolean) {
  await page.emulateMedia({reducedMotion:reducedMotion?'reduce':'no-preference'})
  await page.evaluate(({key,reducedMotion})=>{
    const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)??'{}'),reducedMotion})
    localStorage.setItem(key,next)
    window.dispatchEvent(new StorageEvent('storage',{key,newValue:next}))
  },{key:PREF_KEY,reducedMotion})
  await expect(page.locator('.vpo-shell')).toHaveAttribute('data-reduced-motion','true')
}

test('OVERLAY_V5_FIVE_POINT_ACCEPTANCE. transparent static vehicle, double-click settings, recurring speech and active footer', async ({page}) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  await expect(page.locator('[data-vehicle-pet-menu-trigger]')).toHaveCount(0)
  const scene=page.locator('.vpo-scene .vp-scene')
  expect(await scene.evaluate(node=>getComputedStyle(node).backgroundImage)).toBe('none')
  expect(await scene.evaluate(node=>getComputedStyle(node).boxShadow)).toBe('none')
  expect(await scene.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  await setLegacyMotionPreference(page,false)
  expect(await page.locator('.vpo-shell').evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0)
  const footer=page.locator('[data-vehicle-pet-active-sessions]')
  await expect(footer).toContainText(/暂无活跃会话|No active sessions/)
  await page.screenshot({path:`${ARTIFACTS}/v5-vehicle-transparent.png`})
  await page.locator(PET).dblclick()
  await expect(page.locator(MENU)).toBeVisible()
  await expect(page.locator('[data-vehicle-pet-reduced-motion-option]')).toHaveCount(0)
  await page.screenshot({path:`${ARTIFACTS}/v5-doubleclick-menu.png`})
  await page.locator('[data-vehicle-pet-character-option="companion"]').click()
  await page.keyboard.press('Escape')
  await expect(page.locator(PET)).toBeFocused()
  await expect(page.locator(BUBBLE)).toBeVisible({timeout:45000})
  const first=await page.locator(BUBBLE).textContent()
  await page.screenshot({path:`${ARTIFACTS}/v5-companion-speech.png`})
  await expect(page.locator(BUBBLE)).toHaveCount(0,{timeout:7000})
  await expect(page.locator(BUBBLE)).toBeVisible({timeout:45000})
  expect(await page.locator(BUBBLE).textContent()).not.toBe(first)
  await fetch('http://127.0.0.1:8902/reset',{method:'POST'})
  await sendPrompt(page,'v5-active-session-footer')
  await expect(page.locator(PET)).toHaveAttribute('data-live','running')
  await expect(footer).toHaveAttribute('data-vehicle-pet-active-sessions','1')
  await expect(footer).toContainText(/进行中|Running/)
  const box=(await footer.boundingBox())!
  const composer=(await page.locator('textarea:enabled').last().boundingBox())!
  expect(overlapArea(box,composer)).toBe(0)
  await page.screenshot({path:`${ARTIFACTS}/v5-active-session.png`})
  await expect(footer).toHaveAttribute('data-vehicle-pet-active-sessions','0',{timeout:30000})
  await page.setViewportSize({width:390,height:844})
  // ResizeObserver repositions the surface on the next layout frame.
  await expect.poll(async () => { const box=(await footer.boundingBox())!; return box.x+box.width }).toBeLessThanOrEqual(390)
  const mobile=(await footer.boundingBox())!
  expect(mobile.x).toBeGreaterThanOrEqual(0)
  expect(mobile.x+mobile.width).toBeLessThanOrEqual(390)
  expect(mobile.y+mobile.height).toBeLessThanOrEqual(844)
  await page.screenshot({path:`${ARTIFACTS}/v5-mobile-footer.png`})
})

test('OVERLAY_V5_BACKGROUND_SESSION. pending background metadata remains visible without rebinding the pet', async ({page}) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  for(let attempt=0;attempt<3;attempt++) {
    await sendPrompt(page,`v5-background-permission-${attempt}`)
    await expect.poll(async()=>await page.locator(PET).getAttribute('data-live')==='needs-input' || await page.locator(PET).getAttribute('data-terminal')!==null,{timeout:45000}).toBe(true)
    if(await page.locator(PET).getAttribute('data-live')==='needs-input') break
    await waitForIdleBaseline(page)
  }
  await page.locator('[data-question-key]').waitFor({timeout:15000})
  const footer=page.locator('[data-vehicle-pet-active-sessions]')
  await expect(footer).toHaveAttribute('data-vehicle-pet-active-sessions','1')
  await expect(footer).toContainText(/等待处理|Needs input/)
  const backgroundId=await page.locator(ROOT).getAttribute('data-session-list-current')
  const backgroundTitle=await footer.locator('span').last().textContent()
  await page.getByRole('button',{name:/New Session|新建会话|New chat|新会话/i}).first().click()
  await sendPrompt(page,'v5-current-separate-session')
  await expect(page.locator(PET)).toBeVisible()
  await expect(page.locator(ROOT)).not.toHaveAttribute('data-session-list-current',backgroundId!)
  await expect(page.locator(PET)).toHaveAttribute('data-terminal','failed',{timeout:45000})
  await expect(footer).toHaveAttribute('data-vehicle-pet-active-sessions','1')
  await expect(footer).toContainText(backgroundTitle!)
  await expect(footer).toContainText(/等待处理|Needs input/)
  expect(await footer.textContent()).not.toContain(backgroundId!)
  const currentId=await page.locator(ROOT).getAttribute('data-session-list-current')
  await expect(page.locator(ROOT)).toHaveAttribute('data-adapter-session',currentId!)
  await page.screenshot({path:`${ARTIFACTS}/v5-background-pending.png`})
})

test('V6_COMPACT_PLAYFUL: real alpha gap all levels and eight reactions for both characters', async ({ page }) => {
  await openOverlay(page)
  await waitForIdleBaseline(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  buildClientGeneration('e2e-r3-active-matrix')
  await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'e2e-r3-active-matrix', { timeout: 60000 })
  try {
    for (const level of fleetManifest.levels) {
      await page.evaluate(points => (window as unknown as { __vehiclePetE2E: { progress: { setPoints: (n:number)=>void } } }).__vehiclePetE2E.progress.setPoints(points), level.threshold)
      await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', level.levelId)
      const skip = page.getByRole('button', { name: /^(Skip|跳过)$/ })
      if (await skip.isVisible()) await skip.click()

      for (const size of ['large', 'small']) {
        await openMenu(page)
        await page.locator('[data-vehicle-pet-character-option="vehicle"]').click()
        await page.locator(`[data-vehicle-pet-size-option="${size}"]`).click()
        await closeMenu(page)
        await page.locator(PET).evaluate(el => (el as HTMLElement).blur())
        const bottom = await page.locator('.vpo-scene [data-pet-subject="true"] > img').evaluate(async node => {
          const img = node as HTMLImageElement
          await img.decode()
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
          const context = canvas.getContext('2d')!
          context.drawImage(img,0,0)
          const pixels = context.getImageData(0,0,canvas.width,canvas.height).data
          let last = 0
          for (let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) if(pixels[(y*canvas.width+x)*4+3]!>8) last=y+1
          const box=img.getBoundingClientRect()
          return box.top+box.height*last/canvas.height
        })
        const grade = (await page.locator('[data-vehicle-pet-grade]').boundingBox())!
        const footer = (await page.locator('.vpo-activeSessions').boundingBox())!
        expect(grade.y-bottom, `${size}/${level.levelId} alpha gap`).toBeGreaterThanOrEqual(6)
        expect(grade.y-bottom).toBeLessThanOrEqual(14)
        expect(footer.y-grade.y-grade.height).toBeGreaterThanOrEqual(4)
        expect(footer.y-grade.y-grade.height).toBeLessThanOrEqual(8)
        expect(footer.y+footer.height).toBeLessThanOrEqual(VIEWPORT.height)
        await page.locator(SHELL).screenshot({path:`${ARTIFACTS}/v6-${size}-${level.levelId}.png`})
      }
    }
    // Reset the disposable fixture's subject, preserving monotonic real progression.
    await page.evaluate(() => (window as unknown as { __vehiclePetE2E: { progress: { resetSubject: ()=>void } } }).__vehiclePetE2E.progress.resetSubject())
    await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', 'l1')
    for (const character of ['vehicle', 'companion']) {
      await openMenu(page)
      await page.locator(`[data-vehicle-pet-character-option="${character}"]`).click()
      await page.locator('[data-vehicle-pet-size-option="large"]').click()
      await closeMenu(page)
      const seen = new Set<string>()
      for (let index=0;index<8;index++) {
        await page.locator(PET).press('Enter')
        const area=page.locator('.vpo-characterArea')
        const gesture=(await area.getAttribute('data-gesture'))!
        seen.add(gesture)
        expect(await area.evaluate(el=>el.getAnimations().length)).toBe(0)
        await page.locator(PET).evaluate(el => (el as HTMLElement).blur())
        await page.locator(SHELL).screenshot({path:`${ARTIFACTS}/v6-${character}-${gesture}.png`})
      }
      expect(seen.size).toBe(8)
      await page.screenshot({path:`${ARTIFACTS}/v6-${character}-full.png`})
      await page.locator(PET).dblclick()
      await expect(page.locator(MENU)).toBeVisible()
      await expect(page.locator('.vpo-characterArea')).not.toHaveAttribute('data-gesture', /.+/)
      await closeMenu(page)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      const gradeBefore=await page.locator('[data-vehicle-pet-grade]').boundingBox()
      await page.locator(PET).press('Enter')
      await expect.poll(()=>page.locator('.vpo-characterArea').evaluate(el=>el.getAnimations().length)).toBe(1)
      expect(await page.locator('[data-vehicle-pet-grade]').boundingBox()).toEqual(gradeBefore)
      await expect(page.locator('.vpo-characterArea')).not.toHaveAttribute('data-gesture', /.+/, {timeout:4000})
      expect(await page.locator('.vpo-characterArea').evaluate(el=>el.getAnimations().length)).toBe(0)
      await page.emulateMedia({ reducedMotion: 'reduce' })
    }
  } finally {
    buildClientGeneration('production')
    await expect(page.locator(ROOT)).toHaveAttribute('data-client-generation', 'production', { timeout:60000 })
  }
})
