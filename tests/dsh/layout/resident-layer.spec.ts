import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const source = readFileSync(new URL('../../../src/dsh/client/styles.ts', import.meta.url), 'utf8')
const styles = source.match(/const css = `([\s\S]*?)`/)?.[1]
if (!styles) throw new Error('Overlay stylesheet not found')

test.beforeEach(async ({ page }) => {
  // Reproduce the observed host geometry without running a model, loading
  // private sessions, changing another plugin, or launching production DSH.
  await page.setContent(`
    <style>
      body { margin: 0 }
      #frame { position:relative; height:100vh; overflow:hidden }
      #overlays { position:absolute; inset:0; z-index:60; pointer-events:none }
      #whale { position:absolute; left:1020px; top:430px; width:260px;
        height:80px; z-index:60; pointer-events:auto }
      #overflow { position:absolute; top:798px; height:1px; width:1px }
      #composer { position:absolute; left:400px; top:650px; width:600px }
    </style>
    <style>${styles}</style>
    <div id="frame">
      <input id="composer" aria-label="Composer">
      <div id="overlays">
        <button id="whale">Whale bubble</button>
        <div id="overflow"></div>
        <div class="vpo-root" data-vehicle-pet="VISIBLE">
          <div class="vpo-shell" style="left:1152px;top:416px;width:112px;height:112px">
            <button class="vpo-surface" aria-label="Vehicle">Vehicle</button>
          </div>
        </div>
      </div>
    </div>`)
})

test('host overflow and focus scrolling cannot move the resident out of its viewport position', async ({ page }) => {
  const pet = page.getByRole('button', { name: 'Vehicle', exact: true })
  const before = await pet.boundingBox()
  await page.locator('#frame').evaluate(element => { element.scrollTop = 79 })
  expect(await page.locator('#frame').evaluate(element => element.scrollTop)).toBe(79)
  expect(await pet.boundingBox()).toEqual(before)
})

test('an overlapping peer bubble cannot swallow a normal vehicle click; empty overlay remains click-through', async ({ page }) => {
  const pet = page.getByRole('button', { name: 'Vehicle', exact: true })
  await pet.click({ timeout: 1500 })
  await expect(pet).toBeFocused()
  await page.getByRole('textbox', { name: 'Composer' }).click()
  await expect(page.getByRole('textbox', { name: 'Composer' })).toBeFocused()
  // A non-overlapped part of the peer remains usable as well.
  await page.getByRole('button', { name: 'Whale bubble' }).click({ position: { x: 10, y: 10 } })
  await expect(page.getByRole('button', { name: 'Whale bubble' })).toBeFocused()
})
