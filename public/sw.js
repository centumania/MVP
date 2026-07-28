/**
 * CentuMania service worker — minimal, deliberately conservative.
 *
 * WHY IT EXISTS: a fetch handler is what makes Chrome consider the site
 * "installable" (Add to Home Screen). Nothing more.
 *
 * WHAT IT DOES NOT DO: cache daily tests, dashboard data, API responses, or any
 * auth-gated page. This is a fast-moving exam-prep app — the daily test window,
 * scores, Centum Index and leaderboard change by the minute. Caching any of
 * that risks a student sitting a stale test or seeing a stale rank. So every
 * request goes straight to the network; the cache is used only for a small,
 * versioned set of truly static brand assets, and only as a fallback if the
 * network is unreachable (offline).
 */
const CACHE = 'centumania-static-v1'
const STATIC_ASSETS = [
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return // never intercept POST/PUT (payments, submissions, etc.)

  const isStaticAsset = STATIC_ASSETS.some((path) => request.url.endsWith(path))

  if (isStaticAsset) {
    // Static brand assets: cache-first, network fallback.
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    )
    return
  }

  // Everything else (pages, API, auth, daily tests): network-first, ALWAYS.
  // Only fall back to a cached copy if the network is truly unreachable, and
  // only for the static set above — dynamic content has no offline fallback.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
