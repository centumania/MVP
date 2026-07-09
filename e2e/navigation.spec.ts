import { test, expect } from '@playwright/test'

test.describe('Landing page navigation', () => {
  test('every same-origin link on the landing page resolves without a 404 or 500', async ({ page, request }) => {
    await page.goto('/')
    const hrefs = await page.locator('a[href^="/"]').evaluateAll(
      (els: HTMLAnchorElement[]) => [...new Set(els.map(e => e.getAttribute('href')).filter(Boolean))]
    )

    expect(hrefs.length).toBeGreaterThan(0)

    for (const href of hrefs as string[]) {
      const res = await request.get(href)
      expect(res.status(), `${href} returned ${res.status()}`).toBeLessThan(400)
    }
  })

  test('has a working link into the auth flow', async ({ page }) => {
    await page.goto('/')
    const authLinks = page.locator('a[href*="/auth/"]')
    await expect(authLinks.first()).toBeVisible()
  })
})
