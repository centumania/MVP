import { test, expect } from '@playwright/test'

/**
 * Every protected route must redirect an unauthenticated visitor to
 * /auth/login. This is the single highest-value regression test in the
 * app: a page that forgets its auth guard silently leaks the full UI shell
 * (and sometimes data) to anonymous visitors. Each of these was confirmed
 * against source (grep for the redirect-to-login pattern) before being
 * added here — this spec now guards against that check ever regressing.
 *
 * Dynamic segments use throwaway placeholder IDs — the pages redirect
 * before ever attempting to fetch data for them.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/materials',
  '/materials/placeholder-student/1',
  '/materials/viewer/placeholder-id',
  '/exam/today',
  '/exam/1',
  '/current-affairs',
  '/current-affairs/placeholder-id',
  '/current-affairs/entities',
  '/current-affairs/entities/placeholder-id',
  '/current-affairs/progress',
  '/current-affairs/revision',
  '/profile',
  '/leaderboard',
  '/insights',
  '/mentor/placeholder-exam-id',
  '/study/daily-test',
  '/admin',
  '/admin/centum',
  '/admin/exams',
  '/admin/materials',
  '/admin/payments',
  '/admin/students',
  '/admin/students/placeholder-id',
  '/admin/upload-test',
]

test.describe('Auth guard — protected routes redirect when unauthenticated', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL('**/auth/login', { timeout: 10_000 })
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  }
})
