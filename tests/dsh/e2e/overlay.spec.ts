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
import { mkdirSync, readFileSync } from 'node:fs'
import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test'
import sharp from 'sharp'

interface MatrixManifest {
  readonly levels: readonly { levelId: string; threshold: number }[]
}

const fleetManifest = JSON.parse(readFileSync(new URL('../../../src/packs/autonomous-fleet/manifest.json', import.meta.url), 'utf8')) as MatrixManifest
const seedlingManifest = JSON.parse(readFileSync(new URL('../../../src/packs/seedling-fixture/manifest.json', import.meta.url), 'utf8')) as MatrixManifest

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

async function petBox(page: Page) {
  return page.locator(PET).boundingBox()
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
  const bottomGap = VIEWPORT.height - (box!.y + box!.height)
  expect(bottomGap).toBeGreaterThanOrEqual(160)
  expect(bottomGap).toBeLessThanOrEqual(220)
  await page.screenshot({ path: `${ARTIFACTS}/visible.png` })
})

test('DEFAULT_COMPOSER_OVERLAP_TEST. safe bottom-right avoids composer and send button', async ({ page }) => {
  await openOverlay(page)
  const pet = await petBox(page)
  const composer = await composerBounds(page)
  const send = await page.getByRole('button', { name: /发送消息|Send message/ }).first().boundingBox()
  expect(pet).not.toBeNull()
  expect(send).not.toBeNull()
  expect(overlapArea(pet!, composer)).toBe(0)
  expect(overlapArea(pet!, send!)).toBe(0)
})

test('MOBILE_COMPOSER_OVERLAP_TEST. 390px viewport keeps the pet on-screen and clear of composer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openOverlay(page)
  const pet = await petBox(page)
  const composer = await composerBounds(page)
  expect(pet).not.toBeNull()
  expect(overlapArea(pet!, composer)).toBe(0)
  expect(pet!.x).toBeGreaterThanOrEqual(0)
  expect(pet!.y).toBeGreaterThanOrEqual(0)
  expect(pet!.x + pet!.width).toBeLessThanOrEqual(390)
  expect(pet!.y + pet!.height).toBeLessThanOrEqual(844)
  await page.screenshot({ path: `${ARTIFACTS}/mobile-safe-visible.png` })
})

test('SCENE_COMPACT_GEOMETRY_TEST. Fleet and Seedling subjects remain centred and visible in 112px', async ({ page }) => {
  await openOverlay(page)
  const assertSubject = async () => {
    const scene = await page.locator(`${PET} .vp-scene`).boundingBox()
    const subject = await page.locator(`${PET} [data-pet-subject="true"]`).boundingBox()
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
  await page.screenshot({ path: `${ARTIFACTS}/fleet-visible-r2.png` })
  await page.locator(PET).click()
  await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
  await expect(page.locator('[data-vehicle-pet-pack-name]')).not.toHaveText('无人车队')
  await page.locator(PET).click()
  await assertSubject()
  await page.screenshot({ path: `${ARTIFACTS}/seedling-visible-r2.png` })
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

test('USER_CUSTOM_POSITION_PRESERVATION_TEST. dragged ratios survive refresh without safe-default override', async ({ page }) => {
  await openOverlay(page)
  const pet = page.locator(PET)
  const origin = await petBox(page)
  await pet.hover()
  await page.mouse.down()
  await page.mouse.move(origin!.x - 180, origin!.y - 100, { steps: 8 })
  await page.mouse.up()
  const before = await petBox(page)
  const stored = await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))
  const record = JSON.parse(stored ?? '{}') as { position: { xRatio: number; yRatio: number }; positionCustomized: boolean }
  expect(record.positionCustomized).toBe(true)
  expect(Number.isFinite(record.position.xRatio)).toBe(true)
  expect(record.position.xRatio).toBeLessThan(0.95)
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const after = await petBox(page)
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(4)
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(4)
})

test('PANEL_COMPLETE_ACTIVE_SURFACE_CLAMP_TEST. resize and xRatio 0.49 clamp the real Pet + Panel union', async ({ page }) => {
  await openOverlay(page)
  await page.evaluate(() => localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify({
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.waitForTimeout(300)
  const anchorBeforeOpen = await page.locator(PET).boundingBox()
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()

  const assertCompleteSurface = async (viewport: { width: number; height: number }) => {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(350)
    const pet = await page.locator(PET).boundingBox()
    const panel = await page.locator(PANEL).boundingBox()
    expect(pet).not.toBeNull()
    expect(panel).not.toBeNull()
    const union = {
      left: Math.min(pet!.x, panel!.x),
      top: Math.min(pet!.y, panel!.y),
      right: Math.max(pet!.x + pet!.width, panel!.x + panel!.width),
      bottom: Math.max(pet!.y + pet!.height, panel!.y + panel!.height),
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
  await page.locator(PET).click()
  await page.waitForTimeout(300)
  const anchorAfterClose = await page.locator(PET).boundingBox()
  expect(Math.abs(anchorAfterClose!.x - anchorBeforeOpen!.x)).toBeLessThanOrEqual(33)
  expect(Math.abs(anchorAfterClose!.y - anchorBeforeOpen!.y)).toBeLessThanOrEqual(1)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as { position: { xRatio: number } }
  expect(stored.position.xRatio).toBeGreaterThanOrEqual(0)
  expect(stored.position.xRatio).toBeLessThanOrEqual(1)
  await page.setViewportSize(VIEWPORT)
})

test('PANEL_OPEN_FIRST_KEYBOARD_STEP_MOVES_TEST + PANEL_OPEN_FIRST_POINTER_DRAG_MOVES_TEST. PANEL_OPEN movement has no coordinate dead zone', async ({ page }) => {
  await openOverlay(page)
  await page.evaluate(() => localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify({
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  await page.waitForTimeout(350)

  const preference = async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}') as {
      position: { xRatio: number; yRatio: number }
    }
    return value.position
  })
  const keyboardBefore = await petBox(page)
  const keyboardRatioBefore = await preference()
  await page.locator(PET).focus()
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(350)
  const keyboardAfter = await petBox(page)
  const keyboardRatioAfter = await preference()
  const keyboardDelta = Math.abs(keyboardAfter!.x - keyboardBefore!.x) + Math.abs(keyboardAfter!.y - keyboardBefore!.y)
  console.info('PANEL_OPEN_DEAD_ZONE_TRACE', {
    inputType: 'keyboard', inputDirection: 'left', inputApplied: true,
    movementSpaceRemaining: keyboardBefore!.x > 16,
    persistedRatioBefore: keyboardRatioBefore, persistedRatioAfter: keyboardRatioAfter,
    visiblePetPositionBefore: { x: keyboardBefore!.x, y: keyboardBefore!.y },
    visiblePetPositionAfter: { x: keyboardAfter!.x, y: keyboardAfter!.y },
    visibleActiveSurfaceDeltaPx: keyboardDelta,
  })
  expect(keyboardBefore!.x).toBeGreaterThan(16)
  expect(keyboardDelta).toBeGreaterThan(0)
  expect(keyboardAfter!.x).toBeLessThan(keyboardBefore!.x)

  await page.evaluate(() => localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify({
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })))
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  await page.waitForTimeout(350)
  const pointerBefore = await petBox(page)
  const pointerRatioBefore = await preference()
  await page.mouse.move(pointerBefore!.x + pointerBefore!.width / 2, pointerBefore!.y + pointerBefore!.height / 2)
  await page.mouse.down()
  await page.mouse.move(pointerBefore!.x + pointerBefore!.width / 2 - 20, pointerBefore!.y + pointerBefore!.height / 2, { steps: 2 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const pointerAfter = await petBox(page)
  const pointerRatioAfter = await preference()
  const pointerDelta = Math.abs(pointerAfter!.x - pointerBefore!.x) + Math.abs(pointerAfter!.y - pointerBefore!.y)
  console.info('PANEL_OPEN_DEAD_ZONE_TRACE', {
    inputType: 'pointer', inputDirection: 'left', inputApplied: true,
    movementSpaceRemaining: pointerBefore!.x > 16,
    persistedRatioBefore: pointerRatioBefore, persistedRatioAfter: pointerRatioAfter,
    visiblePetPositionBefore: { x: pointerBefore!.x, y: pointerBefore!.y },
    visiblePetPositionAfter: { x: pointerAfter!.x, y: pointerAfter!.y },
    visibleActiveSurfaceDeltaPx: pointerDelta,
  })
  expect(pointerBefore!.x).toBeGreaterThan(16)
  expect(pointerDelta).toBeGreaterThan(0)
  expect(pointerAfter!.x).toBeLessThan(pointerBefore!.x)
  await page.setViewportSize(VIEWPORT)
})

test('PANEL_OPEN_OPEN_CLOSE_WITHOUT_INPUT_PRESERVES_ANCHOR_TEST + PANEL_OPEN_MOVEMENT_COMMITS_CANONICAL_RATIO_TEST + PANEL_OPEN_REFRESH_RESTORES_MOVED_POSITION_TEST + PANEL_OPEN_RESIZE_HAS_NO_DEAD_ZONE_TEST + PANEL_OPEN_MULTITAB_MOVEMENT_SYNC_TEST', async ({ context, page }) => {
  await openOverlay(page)
  await page.evaluate(() => localStorage.setItem('vehicle-pet/overlay-preferences/v1', JSON.stringify({
    schemaVersion: 1,
    position: { xRatio: 0.49, yRatio: 1 },
    positionCustomized: true,
    collapsed: false,
  })))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const closedBefore = await petBox(page)
  const storedBeforeOpen = await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  await page.waitForTimeout(350)
  expect(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))).toBe(storedBeforeOpen)
  await page.locator(PET).click()
  await expect(page.locator(PANEL)).toHaveCount(0)
  await page.waitForTimeout(300)
  const closedWithoutInput = await petBox(page)
  expect(Math.abs(closedWithoutInput!.x - closedBefore!.x)).toBeLessThan(1)
  expect(Math.abs(closedWithoutInput!.y - closedBefore!.y)).toBeLessThan(1)
  expect(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1'))).toBe(storedBeforeOpen)

  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  const projectedBeforeMove = await petBox(page)
  await page.locator(PET).focus()
  await page.keyboard.press('Shift+ArrowLeft')
  await page.waitForTimeout(300)
  const projectedAfterMove = await petBox(page)
  expect(projectedAfterMove!.x).toBeLessThan(projectedBeforeMove!.x)
  const canonical = await page.evaluate(() => JSON.parse(localStorage.getItem('vehicle-pet/overlay-preferences/v1') ?? '{}')) as {
    position: { xRatio: number; yRatio: number }; positionCustomized: boolean
  }
  expect(canonical.positionCustomized).toBe(true)
  expect(canonical.position.xRatio).toBeGreaterThanOrEqual(0)
  expect(canonical.position.xRatio).toBeLessThanOrEqual(1)
  await page.locator(PET).click()
  await expect(page.locator(PANEL)).toHaveCount(0)
  await page.waitForTimeout(300)
  const closedAfterMove = await petBox(page)
  expect(Math.abs(closedAfterMove!.x - projectedAfterMove!.x)).toBeLessThan(1)

  await page.reload()
  await expect.poll(() => page.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  const refreshed = await petBox(page)
  expect(Math.abs(refreshed!.x - closedAfterMove!.x)).toBeLessThan(1)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  await page.setViewportSize({ width: 768, height: 720 })
  await page.waitForTimeout(350)
  const resizedBefore = await petBox(page)
  await page.locator(PET).focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  const resizedAfter = await petBox(page)
  expect(resizedAfter!.x).toBeGreaterThan(resizedBefore!.x)

  const second = await context.newPage()
  await second.setViewportSize({ width: 768, height: 720 })
  await second.goto('/')
  await expect.poll(() => second.locator(PET).count(), { timeout: 30_000 }).toBe(1)
  await expect.poll(async () => second.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
    .toBe(await page.evaluate(() => localStorage.getItem('vehicle-pet/overlay-preferences/v1')))
  await second.locator(PET).click()
  await second.locator(PANEL).waitFor()
  const secondBefore = await second.locator(PET).boundingBox()
  await second.locator(PET).focus()
  await second.keyboard.press('ArrowUp')
  await second.waitForTimeout(300)
  const secondAfter = await second.locator(PET).boundingBox()
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
  expect(overlapArea(box!, await composerBounds(page))).toBe(0)
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

test('SCENE_FULL_JOURNEY_GEOMETRY_TEST. Fleet and Seedling journey layers stay in scene bounds', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  await page.locator(PANEL).waitFor()
  const trigger = page.locator('[data-vehicle-pet-open-journey]')
  const dialog = page.locator('[data-vehicle-pet-dialog]')

  const assertJourney = async (screenshot: string) => {
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
    await page.screenshot({ path: `${ARTIFACTS}/${screenshot}` })
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
    await page.keyboard.press('Escape')
    await expect.poll(() => page.locator('[data-vehicle-pet-dialog]').count()).toBe(0)
    expect(await trigger.evaluate(node => document.activeElement === node)).toBe(true)

    await trigger.click()
    await dialog.waitFor()
    await page.locator('[data-vehicle-pet-dialog-close]').click()
    await expect.poll(() => page.locator('[data-vehicle-pet-dialog]').count()).toBe(0)
    expect(await trigger.evaluate(node => document.activeElement === node)).toBe(true)
  }

  await assertJourney('fleet-journey-r2.png')
  await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
  await expect(page.locator('[data-vehicle-pet-pack-name]')).toHaveText(/种子伙伴|Seedling/)
  await assertJourney('seedling-journey-r2.png')
  await page.locator(PET).click({ position: { x: 4, y: 4 } })
})

test('REDUCED_MOTION_STATIC_GEOMETRY_TEST. reduced motion preserves compact subject bounds', async ({ page }) => {
  await openOverlay(page)
  const subject = page.locator(`${PET} [data-pet-subject="true"]`)
  const before = await subject.boundingBox()
  await page.locator(PET).click()
  await page.locator('[data-vehicle-pet-reduced-motion-option="on"]').click()
  await page.locator(PET).click()
  await expect(page.locator(`${PET} .vp-scene`)).toHaveAttribute('data-reduced-motion', 'true')
  const after = await subject.boundingBox()
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(1)
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
  expect(Math.abs(after!.width - before!.width)).toBeLessThan(1)
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1)
  await page.screenshot({ path: `${ARTIFACTS}/reduced-motion-visible-r2.png` })
})

test('SETTINGS_PRIMARY_ACTION_OVERLAP_TEST measures Pet and open Panel against real Settings actions', async ({ page }) => {
  await openOverlay(page)
  await page.locator(PET).click()
  await expect(page.locator(PANEL)).toHaveCount(1)
  const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
  await settings.click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: /^(Close|关闭)$/ }) })
  await dialog.waitFor({ state: 'visible' })
  const actions = dialog.getByRole('button')
  const actionBoxes = (await Promise.all(Array.from({ length: await actions.count() }, async (_, index) => actions.nth(index).boundingBox()))).filter(box => box !== null)
  expect(actionBoxes.length).toBeGreaterThan(0)
  const pet = await petBox(page)
  expect(pet).not.toBeNull()
  for (const action of actionBoxes) expect(overlapArea(pet!, action!)).toBe(0)

  const panel = await page.locator(PANEL).boundingBox()
  expect(panel).not.toBeNull()
  for (const action of actionBoxes) expect(overlapArea(panel!, action!)).toBe(0)
  await page.screenshot({ path: `${ARTIFACTS}/r3-settings-overlap.png` })
  await page.keyboard.press('Escape')
})

test('WORKSPACE_PRIMARY_ACTION_OVERLAP_TEST measures Pet and open Panel against real Workspace controls', async ({ page }) => {
  await openOverlay(page)
  const actions = page.getByRole('button', { name: /Add workspace|添加工作区|Board|看板|Add group|添加分组/ })
  await expect(actions.first()).toBeVisible()
  const actionBoxes = (await Promise.all(Array.from({ length: await actions.count() }, async (_, index) => actions.nth(index).boundingBox()))).filter(box => box !== null)
  expect(actionBoxes.length).toBeGreaterThan(0)
  const pet = await petBox(page)
  expect(pet).not.toBeNull()
  for (const action of actionBoxes) expect(overlapArea(pet!, action!)).toBe(0)
  await page.locator(PET).click()
  const panel = await page.locator(PANEL).boundingBox()
  expect(panel).not.toBeNull()
  for (const action of actionBoxes) expect(overlapArea(panel!, action!)).toBe(0)
  await page.screenshot({ path: `${ARTIFACTS}/r3-workspace-overlap.png` })
})

test('HARNESS_LOCALE_LIVE_SYNC_TEST. zh-CN → en → zh-CN updates Pack, stage, target, keepsake, and journey live', async ({ page }) => {
  await openOverlay(page)
  const ensurePanel = async () => {
    if (await page.locator(PANEL).count() === 0) await page.locator(PET).click()
    await page.locator(PANEL).waitFor()
  }
  const switchHarnessLocale = async (option: 'English' | '中文') => {
    const settings = page.getByRole('button', { name: /Settings|设置/i }).first()
    await settings.click()
    const selector = page.getByRole('button', { name: /^(中文|English)$/ }).last()
    await selector.waitFor({ timeout: 20_000 })
    await selector.click()
    await page.getByRole('menuitem', { name: option, exact: true }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(option === 'English' ? 'en' : 'zh-CN')
    await page.keyboard.press('Escape')
    await ensurePanel()
  }
  const assertCopy = async (english: boolean) => {
    await expect(page.locator('[data-vehicle-pet-pack-name]')).toHaveText(english ? 'Autonomous Fleet' : '无人车队')
    await expect(page.locator('[data-vehicle-pet-stage]')).toContainText(english ? 'First Road Test' : '首航路测')
    await expect(page.locator('[data-vehicle-pet-next-threshold]')).toContainText(english ? 'Next milestone' : '下一目标')
    await expect(page.locator('[data-vehicle-pet-keepsake]')).toHaveText(english ? 'No keepsakes yet' : '还没有纪念品')
    const trigger = page.locator('[data-vehicle-pet-open-journey]')
    await trigger.click()
    const dialog = page.locator('[data-vehicle-pet-dialog]')
    await expect(dialog).toHaveAttribute('aria-label', english ? 'Growth Journey' : '成长旅程')
    await expect(dialog).toContainText(english ? 'First run on the road; road testing begins.' : '第一次上路，路测正式开始。')
    await page.keyboard.press('Escape')
  }

  await ensurePanel()
  await switchHarnessLocale('中文')
  await assertCopy(false)
  await switchHarnessLocale('English')
  await assertCopy(true)
  await switchHarnessLocale('中文')
  await assertCopy(false)
  await expect(page.locator('.vpo-root')).toHaveCount(1)
})

test('CROSSTAB_COLLAPSE_RESTORE_VISIBLE_TEST. two tabs destroy stale Panel/Dialog and never write-loop', async ({ context, page }) => {
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

  await page.locator(PET).click()
  await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
  await page.locator('[data-vehicle-pet-open-journey]').click()
  await expect(page.locator('[data-vehicle-pet-dialog]')).toHaveCount(1)

  await second.locator(PET).click()
  await second.locator('[data-vehicle-pet-collapse]').click()
  for (const target of [page, second]) {
    await expect(target.locator(LAUNCHER)).toHaveCount(1)
    await expect(target.locator(PET)).toHaveCount(0)
    await expect(target.locator(PANEL)).toHaveCount(0)
    await expect(target.locator('[data-vehicle-pet-dialog]')).toHaveCount(0)
  }
  expect(await writes(page)).toBe(0)
  expect(await writes(second)).toBe(1)

  await page.reload()
  await expect(page.locator(LAUNCHER)).toHaveCount(1)
  await instrumentWrites(page)
  await second.locator(LAUNCHER).click()
  for (const target of [page, second]) {
    await expect(target.locator(PET)).toHaveCount(1)
    await expect(target.locator(PANEL)).toHaveCount(0)
    await expect(target.locator('[data-vehicle-pet-dialog]')).toHaveCount(0)
  }
  expect(await writes(page)).toBe(0)
  expect(await writes(second)).toBe(2)

  for (const target of [page, second]) {
    await target.locator(PET).click()
    await target.locator('[data-vehicle-pet-collapse]').click()
    await expect(page.locator(LAUNCHER)).toHaveCount(1)
    await expect(second.locator(LAUNCHER)).toHaveCount(1)
    await target.locator(LAUNCHER).click()
    await expect(page.locator(PET)).toHaveCount(1)
    await expect(second.locator(PET)).toHaveCount(1)
    await expect(page.locator(PANEL)).toHaveCount(0)
    await expect(second.locator(PANEL)).toHaveCount(0)
  }
  expect(await writes(page)).toBe(2)
  expect(await writes(second)).toBe(4)
  await second.close()
})

test('FULL_JOURNEY_LIGHT_THEME_CONTRAST_TEST + FULL_JOURNEY_DARK_THEME_CONTRAST_TEST', async ({ page }) => {
  await openOverlay(page)
  buildClientGeneration('e2e-r3-active-r4-contrast-matrix')
  await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', 'e2e-r3-active-r4-contrast-matrix', { timeout: 60_000 })
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __vehiclePetE2E?: { progress?: unknown } }).__vehiclePetE2E?.progress))).toBe(true)

  const ensurePanel = async () => {
    if (await page.locator(PANEL).count() === 0) await page.locator(PET).click()
    await page.locator(PANEL).waitFor()
  }
  const setPoints = async (points: number) => page.evaluate(value => {
    ;(window as unknown as { __vehiclePetE2E: { progress: { setPoints: (next: number) => void } } }).__vehiclePetE2E.progress.setPoints(value)
  }, points)
  const resetSubject = async () => page.evaluate(() => {
    ;(window as unknown as { __vehiclePetE2E: { progress: { resetSubject: () => void } } }).__vehiclePetE2E.progress.resetSubject()
  })
  const setLocale = async (locale: 'zh-CN' | 'en') => {
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
    await ensurePanel()
    await page.locator(`[data-vehicle-pet-reduced-motion-option="${reduced ? 'on' : 'off'}"]`).click()
  }
  const sampleContrast = async (): Promise<{ min: number; samples: number }> => {
    await ensurePanel()
    await page.locator('[data-vehicle-pet-open-journey]').click()
    const dialog = page.locator('[data-vehicle-pet-dialog]')
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
    await resetSubject()
    await ensurePanel()
    await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
    await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-pack', 'seedling-fixture')
    await setPoints(0)
    await runVariants() // Seedling seed
    await setPoints(300_000)
    await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', 'forest')
    await runVariants() // Seedling forest

    await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
    const darkResult = await sampleContrast()
    minimum = Math.min(minimum, darkResult.min)
    console.log(`FULL_JOURNEY_MIN_CONTRAST_RATIO=${minimum.toFixed(3)}`)
    expect(minimum).toBeGreaterThanOrEqual(4.5)
  } finally {
    await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
    buildClientGeneration('production')
    await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
  }
})

test('COMPACT_ALL_LEVEL_PIXEL_MATRIX_TEST + COMPACT_MILESTONE_SUBJECT_OVERLAP_TEST + COMPACT_BLACK_VOID_TEST', async ({ page }) => {
  await openOverlay(page)
  buildClientGeneration('e2e-r3-active-matrix')
  await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', 'e2e-r3-active-matrix', { timeout: 60_000 })
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
    await page.locator(PET).click()
    await page.locator(`[data-vehicle-pet-reduced-motion-option="${enabled ? 'on' : 'off'}"]`).click()
    await page.locator(PET).click()
    await expect(page.locator(`${PET} .vp-scene`)).toHaveAttribute('data-reduced-motion', enabled ? 'true' : 'false')
  }
  const runLevels = async (packId: string, levels: readonly { levelId: string; threshold: number }[]) => {
    for (const level of levels) {
      await setPoints(level.threshold)
      await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-level', level.levelId)
      await expect(page.locator(PET)).toHaveAttribute('data-vehicle-pet-pack', packId)
      await page.waitForTimeout(500)
      const scene = page.locator(`${PET} .vp-scene`)
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

      await page.locator(PET).click()
      await page.locator('[data-vehicle-pet-open-journey]').click()
      const dialogScene = page.locator('[data-vehicle-pet-dialog] .vp-scene')
      const dialogBounds = await dialogScene.boundingBox()
      const dialogSubject = await dialogScene.locator('[data-pet-subject="true"]').boundingBox()
      expect(dialogBounds).not.toBeNull()
      expect(dialogSubject).not.toBeNull()
      expect(overlapArea(dialogSubject!, dialogBounds!) / (dialogSubject!.width * dialogSubject!.height)).toBeGreaterThanOrEqual(0.85)
      await dialogScene.screenshot({ path: `${ARTIFACTS}/r3-${packId}-${level.levelId}-journey.png` })
      await page.keyboard.press('Escape')
      await page.locator(PET).click()
    }
  }

  try {
    await runLevels('autonomous-fleet', fleetManifest.levels)
    await page.evaluate(() => {
      const control = (window as unknown as {
        __vehiclePetE2E: { progress: { resetSubject: () => void } }
      }).__vehiclePetE2E.progress
      control.resetSubject()
    })
    await page.locator(PET).click()
    await page.locator('[data-vehicle-pet-pack-option="seedling-fixture"]').click()
    await page.locator(PET).click()
    await runLevels('seedling-fixture', seedlingManifest.levels)
  } finally {
    buildClientGeneration('production')
    await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
  }
})

test('REAL_HARNESS_INDEXEDDB_DISPOSAL_TEST + REAL_HARNESS_HMR_RESOURCE_INVENTORY_TEST', async ({ page }) => {
  await openOverlay(page)
  await expect.poll(() => page.locator(PET).getAttribute('data-live'), { timeout: 90_000 }).toBe('idle')
  await expect.poll(() => page.locator(PET).getAttribute('data-terminal'), { timeout: 15_000 }).toBeNull()
  await page.waitForTimeout(4200)
  await expect(page.locator(PILL)).toHaveCount(0)
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
  await expect(page.locator('.vpo-root')).toHaveCount(0)
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
      await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', activeGeneration, { timeout: 60_000 })
      await expect(page.locator(PET)).toHaveCount(1)
      await expect.poll(async () => (await resourceSnapshot(page)).indexedDbConnections).toBe(1)

      await page.locator(PET).click()
      await page.locator('[data-vehicle-pet-open-journey]').click()
      await expect(page.locator('[data-vehicle-pet-dialog]')).toHaveCount(1)
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
      await expect(page.locator('.vpo-root')).toHaveCount(0)
      await expect(page.locator('[data-vehicle-pet-dialog]')).toHaveCount(0)
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
    await expect(page.locator('.vpo-root')).toHaveAttribute('data-client-generation', 'production', { timeout: 60_000 })
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
