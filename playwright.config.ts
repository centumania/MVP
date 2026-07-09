import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. Runs against `npm run dev` on PORT (default 3100, kept distinct
 * from the app's default 3000 so it never collides with a dev server the
 * team already has open). No test database/fixtures are provisioned here —
 * specs are scoped to what's safely verifiable without live payment-verified
 * accounts: public pages, auth-guard redirects, and form validation.
 */
const PORT = process.env.E2E_PORT ?? '3100'
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
})
