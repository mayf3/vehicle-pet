import { expect, test } from '@playwright/test'

test('locale controls immediately synchronize the document language in both directions', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const english = page.locator('[data-pet-locale-option="en"]')
  const chinese = page.locator('[data-pet-locale-option="zh-CN"]')

  await expect(chinese).toBeVisible()
  await expect(html).toHaveAttribute('lang', 'zh-CN')

  await english.click()
  expect(await html.getAttribute('lang')).toBe('en')
  await expect(english).toHaveAttribute('aria-pressed', 'true')

  await chinese.click()
  expect(await html.getAttribute('lang')).toBe('zh-CN')
  await expect(chinese).toHaveAttribute('aria-pressed', 'true')
})
