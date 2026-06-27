/**
 * scripts/register-qstash-cron.ts
 *
 * Registers (or replaces) the nightly assignment-generation cron in Upstash QStash.
 * Run once after deploying /api/generate-assignments to Vercel.
 *
 * Schedule: 18:00 UTC daily = 23:30 IST (India Standard Time, no DST)
 *
 * Required env vars (set in shell before running):
 *   QSTASH_TOKEN         — from Upstash QStash console
 *   VERCEL_DEPLOYMENT_URL — e.g. https://centumania-mvp.vercel.app
 *   ASSIGNMENT_SECRET     — same value set in Vercel env vars
 *
 * Usage:
 *   QSTASH_TOKEN=xxx VERCEL_DEPLOYMENT_URL=https://... ASSIGNMENT_SECRET=yyy \
 *   npx tsx scripts/register-qstash-cron.ts
 *
 * No new npm packages: uses built-in fetch (Node 18+).
 */

const QSTASH_TOKEN          = process.env.QSTASH_TOKEN
const VERCEL_DEPLOYMENT_URL = process.env.VERCEL_DEPLOYMENT_URL
const ASSIGNMENT_SECRET     = process.env.ASSIGNMENT_SECRET

if (!QSTASH_TOKEN || !VERCEL_DEPLOYMENT_URL || !ASSIGNMENT_SECRET) {
  console.error('Missing required env vars: QSTASH_TOKEN, VERCEL_DEPLOYMENT_URL, ASSIGNMENT_SECRET')
  process.exit(1)
}

const targetUrl   = `${VERCEL_DEPLOYMENT_URL}/api/generate-assignments`
const encodedUrl  = encodeURIComponent(targetUrl)
const scheduleUrl = `https://qstash.upstash.io/v2/schedules/${encodedUrl}`

async function registerCron(): Promise<void> {
  console.log(`Registering QStash cron → ${targetUrl}`)
  console.log('Schedule: 0 18 * * * (18:00 UTC = 23:30 IST)')

  const response = await fetch(scheduleUrl, {
    method:  'POST',
    headers: {
      'Authorization':                         `Bearer ${QSTASH_TOKEN}`,
      'Content-Type':                          'application/json',
      'Upstash-Cron':                          '0 18 * * *',
      'Upstash-Method':                        'POST',
      'Upstash-Forward-x-assignment-secret':   ASSIGNMENT_SECRET as string,
    },
    body: JSON.stringify({}),
  })

  const body: unknown = await response.json().catch(() => response.text())

  if (!response.ok) {
    console.error('QStash registration failed:', response.status, body)
    process.exit(1)
  }

  console.log('QStash cron registered successfully:', body)
  console.log()
  console.log('Verify in Upstash console: https://console.upstash.com/qstash → Schedules')
}

registerCron().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
