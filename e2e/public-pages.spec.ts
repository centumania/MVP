import { test, expect } from '@playwright/test'

/**
 * Smoke coverage for every page that requires no authentication:
 * loads with a 200, has no console errors, and its primary heading is present.
 */
const PUBLIC_PAGES: { path: string; heading: RegExp }[] = [
  { path: '/',          heading: /crack your government exam/i },
  { path: '/about',     heading: /.+/ },
  { path: '/contact',   heading: /.+/ },
  { path: '/privacy',   heading: /.+/ },
  { path: '/terms',     heading: /.+/ },
  { path: '/refund',    heading: /.+/ },
]

test.describe('Public pages load without error', () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders successfully`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
      page.on('pageerror', err => consoleErrors.push(err.message))

      const response = await page.goto(path)
      expect(response?.ok()).toBeTruthy()
      await expect(page.locator('h1').first()).toContainText(heading)

      expect(consoleErrors, `Console errors on ${path}:\n${consoleErrors.join('\n')}`).toHaveLength(0)
    })
  }
})

test.describe('404 handling', () => {
  test('unknown route shows a not-found page, not a crash', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-e2e-probe')
    expect(response?.status()).toBe(404)
  })
})
