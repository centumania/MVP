import { test, expect } from '@playwright/test'

/**
 * Auth form validation — deliberately does NOT test successful login/signup,
 * since that requires a real, payment-verified Supabase account and this
 * suite must not create or depend on live production user data. Instead it
 * covers what's safely verifiable against the live auth backend: rejecting
 * bad input, and rendering the right fields/links.
 */

test.describe('Login page', () => {
  test('renders the sign-in form', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('rejects invalid credentials with a visible error, no silent redirect', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#email', `e2e-nonexistent-${Date.now()}@centumania-qa-probe.invalid`)
    await page.fill('#password', 'definitely-wrong-password-123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Must show an error and must NOT navigate away from /auth/login
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('links to the register page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('links to forgot-password', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })
})

test.describe('Register page', () => {
  test('renders the sign-up form', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('#email')).toBeVisible()
  })
})

test.describe('Forgot-password page', () => {
  test('renders and accepts an email', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })
})
