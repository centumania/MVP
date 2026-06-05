/**
 * Centumania MVP — k6 Stress Test
 * Simulates 500 concurrent users across all critical endpoints.
 *
 * Install:  brew install k6
 * Run:      k6 run tests/stress-500.js --env BASE_URL=https://your-domain.com
 *
 * Default target: http://localhost:3000
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// ── Custom metrics ─────────────────────────────────────────────────
const apiLatency   = new Trend('api_latency',   true)
const errorRate    = new Rate('error_rate')
const authFailures = new Counter('auth_failures')

// ── Config ─────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Paste a real JWT here for authenticated routes.
// Generate: login via the app → open DevTools → Network →
//   find any /api/* request → copy the Authorization header value.
const BEARER_TOKEN = __ENV.BEARER_TOKEN || 'PASTE_YOUR_JWT_HERE'

const headers = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${BEARER_TOKEN}`,
}

// ── Load profile — ramp to 500 users ─────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50  },  // warm-up
    { duration: '1m',  target: 200 },  // ramp
    { duration: '2m',  target: 500 },  // peak load
    { duration: '1m',  target: 500 },  // sustain
    { duration: '30s', target: 0   },  // cool-down
  ],
  thresholds: {
    http_req_duration:      ['p(95)<2000'],  // 95% requests under 2s
    http_req_failed:        ['rate<0.05'],   // less than 5% errors
    error_rate:             ['rate<0.05'],
  },
}

// ── Test scenarios ────────────────────────────────────────────────
export default function scenario() {
  const scenario = Math.random()

  if (scenario < 0.10) {
    // ── Public pages (no auth) ─────────────────────────────────
    const r = http.get(`${BASE_URL}/auth/login`)
    check(r, { 'login page 200': res => res.status === 200 })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 400)

  } else if (scenario < 0.35) {
    // ── Dashboard API ──────────────────────────────────────────
    const r = http.get(`${BASE_URL}/api/dashboard`, { headers })
    const ok = check(r, {
      'dashboard 200': res => res.status === 200,
      'has paymentPending field': res => JSON.parse(res.body ?? '{}').paymentPending !== undefined,
    })
    apiLatency.add(r.timings.duration)
    errorRate.add(!ok)
    if (r.status === 401) authFailures.add(1)

  } else if (scenario < 0.55) {
    // ── Materials API ──────────────────────────────────────────
    const r = http.get(`${BASE_URL}/api/materials`, { headers })
    check(r, { 'materials 200 or 404': res => [200, 404, 402].includes(res.status) })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 500)

  } else if (scenario < 0.70) {
    // ── Leaderboard API ────────────────────────────────────────
    const r = http.get(`${BASE_URL}/api/leaderboard`, { headers })
    check(r, { 'leaderboard ok': res => res.status < 500 })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 500)

  } else if (scenario < 0.80) {
    // ── Exam window (public, no auth) ──────────────────────────
    const r = http.get(`${BASE_URL}/api/exam/window`)
    check(r, {
      'window 200': res => res.status === 200,
      'has isOpen': res => JSON.parse(res.body ?? '{}').isOpen !== undefined,
    })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 400)

  } else if (scenario < 0.90) {
    // ── Admin stats (admin token required) ────────────────────
    const r = http.get(`${BASE_URL}/api/admin/stats`, { headers })
    check(r, { 'admin stats ok': res => [200, 401, 403].includes(res.status) })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 500)

  } else {
    // ── Static/page load ──────────────────────────────────────
    const r = http.get(`${BASE_URL}/dashboard`)
    check(r, { 'dashboard page 200': res => res.status === 200 })
    apiLatency.add(r.timings.duration)
    errorRate.add(r.status >= 500)
  }

  sleep(Math.random() * 2 + 0.5) // realistic think-time: 0.5–2.5s
}

export function handleSummary(data) {
  return {
    'tests/stress-report.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════╗
║         CENTUMANIA STRESS TEST SUMMARY           ║
╚══════════════════════════════════════════════════╝

 Peak VUs      : ${data.metrics.vus_max?.values?.max ?? 'N/A'}
 Total requests: ${data.metrics.http_reqs?.values?.count ?? 'N/A'}
 Req/s (peak)  : ${Math.round(data.metrics.http_reqs?.values?.rate ?? 0)}
 Error rate    : ${((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%
 p95 latency   : ${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] ?? 0)} ms
 p99 latency   : ${Math.round(data.metrics.http_req_duration?.values?.['p(99)'] ?? 0)} ms
 Auth failures : ${data.metrics.auth_failures?.values?.count ?? 0}
`,
  }
}
