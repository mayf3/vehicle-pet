import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

// CTR-OVERLAY-038 local preview + ACC-OVERLAY-135 preview step: the
// documented creator preview entry (?petPreview=1) must render the REAL
// resident renderer on a fresh page load for every bundled pet and for a
// creator fixture installed from the template — never a blank page.

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') await route.continue()
    else await route.abort('blockedbyclient')
  })
})

const FIXTURE_PET_DIR = path.resolve('src/dsh/client/pets/my-pet')
const FIXTURE_PACK_DIR = path.resolve('src/packs/my-pet-journey')

function petButton(page: Page, petId: string) {
  return page.getByRole('button', { name: new RegExp(`\\(${petId}\\)$`) })
}

async function expectPreviewRenders(page: Page, petId: string): Promise<void> {
  await petButton(page, petId).click()
  // Recipe-agnostic: an engine-scene pet renders the generic scene subject,
  // a pose-sprite pet renders its pose image; either way the real resident
  // visual must be on screen (never a blank stage or an error panel).
  await expect(page.locator('[data-pet-subject="true"], [data-companion-pose]').first()).toBeVisible()
  await expect(page.locator('div[role="alert"]')).toHaveCount(0)
}

function removeFixture(): void {
  rmSync(FIXTURE_PET_DIR, { recursive: true, force: true })
  rmSync(FIXTURE_PACK_DIR, { recursive: true, force: true })
  execSync('node scripts/generate-pet-wiring.mjs')
}

test('preview renders every bundled pet on a fresh page load', async ({ page }) => {
  await page.goto('/?petPreview=1')
  await expect(page.getByRole('heading', { name: /Pet preview/ })).toBeVisible()
  for (const petId of ['vehicle', 'companion', 'orb']) {
    await expectPreviewRenders(page, petId)
  }
})

test('expression and level selectors drive the real resident visual', async ({ page }) => {
  await page.goto('/?petPreview=1')
  await expect(page.getByRole('heading', { name: /Pet preview/ })).toBeVisible()

  // pose-sprite pet: the mapped pose index follows the selected expression
  await petButton(page, 'orb').click()
  await page.getByRole('button', { name: 'idle', exact: true }).click()
  const idlePose = await page.locator('[data-companion-pose]').first().getAttribute('data-companion-pose')
  await page.getByRole('button', { name: 'working', exact: true }).click()
  const workingPose = await page.locator('[data-companion-pose]').first().getAttribute('data-companion-pose')
  expect(idlePose).not.toBeNull()
  expect(workingPose).not.toBeNull()
  expect(idlePose).not.toBe(workingPose)

  // level selector: the description caption reflects the selected level
  await petButton(page, 'vehicle').click()
  const caption = page.locator('p', { hasText: 'Caption policy for this pet' })
  await page.getByRole('button', { name: 'l1', exact: true }).click()
  const levelOneText = await caption.innerText()
  await page.getByRole('button', { name: 'l2', exact: true }).click()
  const levelTwoText = await caption.innerText()
  expect(levelOneText).not.toEqual(levelTwoText)
})

test('SMALL and LARGE sizes render the same resident visual at both surfaces', async ({ page }) => {
  await page.goto('/?petPreview=1')
  await expect(page.getByRole('heading', { name: /Pet preview/ })).toBeVisible()
  await page.getByRole('button', { name: 'LARGE 216px' }).click()
  await expect(page.locator('div[style*="width: 216px"]').first()).toBeVisible()
  await expect(page.locator('[data-pet-subject="true"]')).toBeVisible()
  await page.getByRole('button', { name: 'SMALL 112px' }).click()
  await expect(page.locator('div[style*="width: 112px"]').first()).toBeVisible()
  await expect(page.locator('[data-pet-subject="true"]')).toBeVisible()
})

test.describe('creator fixture pet', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterAll(() => {
    // Safety net: the checkout must never keep the fixture installed.
    removeFixture()
  })

  test('installs the template as a fourth pet and previews it', async ({ page }) => {
    test.setTimeout(120_000)
    // Standard creator install (docs/creator/GETTING_STARTED.md step 4):
    // copy pet/ + journey/ into the bundled locations, regenerate wiring.
    removeFixture()
    execSync('cp -r examples/minimal-pet/pet src/dsh/client/pets/my-pet')
    execSync('cp -r examples/minimal-pet/journey src/packs/my-pet-journey')
    execSync('node scripts/generate-pet-wiring.mjs')
    expect(existsSync(FIXTURE_PET_DIR)).toBe(true)

    // Vite picks up the regenerated wiring and new pack directories; a fresh
    // page load must list and render the creator pet like any bundled pet.
    await page.goto('/?petPreview=1')
    await petButton(page, 'my-pet').waitFor({ state: 'visible', timeout: 30_000 })
    await expectPreviewRenders(page, 'my-pet')
    // its gradeLevels caption comes from the creator's own levels.json
    await expect(page.locator('p', { hasText: 'Caption policy for this pet' })).toContainText('第1层描述')
  })

  test('fixture removal restores the three-pet preview', async ({ page }) => {
    removeFixture()
    await page.goto('/?petPreview=1')
    await expect(page.getByRole('heading', { name: /Pet preview/ })).toBeVisible()
    await expect(petButton(page, 'my-pet')).toHaveCount(0)
    for (const petId of ['vehicle', 'companion', 'orb']) {
      await expectPreviewRenders(page, petId)
    }
  })
})
