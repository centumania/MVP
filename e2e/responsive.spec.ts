import { test, expect, devices } from '@playwright/test'

/**
 * Responsive layout smoke check across the three standard breakpoints,
 * on pages that don't require authentication. Catches the most common
 * regression class: horizontal overflow from a fixed-width element.
 */
const VIEWPORTS = [
  { name: 'mobile',  ...devices['iPhone 13'].viewport },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

const PAGES = ['/', '/auth/login', '/auth/register']

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive — ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const path of PAGES) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path)
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth, `document is ${scrollWidth - clientWidth}px wider than the viewport`).toBeLessThanOrEqual(clientWidth + 1)
      })
    }
  })
}
