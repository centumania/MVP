import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge Middleware — src/middleware.ts
 *
 * Responsibilities:
 *  1. Nonce-based Content Security Policy (strict for all routes)
 *  2. Permissive CSP for /study/, /content/, /pdfs/ and materials viewer routes —
 *     these serve interactive HTML with inline scripts, eval, and CDN assets.
 *  3. All security response headers (HSTS, X-Frame-Options, etc.)
 *  4. Cookie gate: /study/, /content/, /pdfs/ require cm_access session cookie.
 */

// ── Strict CSP — all routes except viewer/study routes ─────────────
function buildStrictCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com",
    "frame-src 'self' blob: https://*.supabase.co https://www.youtube-nocookie.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}

// ── Permissive CSP — study/content/viewer routes ───────────────────
// These routes serve interactive HTML files with inline scripts, external
// CDN libraries (Mermaid), and localStorage access.
// IMPORTANT: do NOT include a nonce here. Per CSP3 spec, when a nonce is
// present in script-src, 'unsafe-inline' is silently ignored and only
// scripts with a matching nonce attribute execute. The static HTML files
// (bio-map.html, etc.) have no nonce attribute on their inline <script>
// blocks, so including a nonce would block all inline JS despite 'unsafe-inline'.
function buildPermissiveCsp(): string {
  const directives: string[] = [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' data: https:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: data:",
    "frame-src 'self' blob: https://*.supabase.co https://www.youtube-nocookie.com https:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
  ]
  return directives.join('; ')
}

// ── Static security headers ────────────────────────────────────────
const STATIC_HEADERS: [string, string][] = [
  ['X-Content-Type-Options',    'nosniff'],
  ['X-Frame-Options',           'DENY'],
  ['Referrer-Policy',           'strict-origin-when-cross-origin'],
  ['Permissions-Policy',        'camera=(), microphone=(), geolocation=(), payment=()'],
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
]

// ── Middleware entry point ─────────────────────────────────────────
export function middleware(request: NextRequest): NextResponse {
  const nonce    = Buffer.from(crypto.randomUUID()).toString('base64')
  const pathname = request.nextUrl.pathname

  // Cookie gate: /study/*, /content/*, /pdfs/* require cm_access cookie
  // (set by /api/materials/status after auth + payment check).
  // Excluded: /study/daily-test — this is a Next.js app route that uses JWT auth,
  // not the cm_access cookie used for static HTML study files.
  const isCookieGated =
    (pathname.startsWith('/study/') && !pathname.startsWith('/study/daily-test')) ||
    pathname.startsWith('/content/') ||
    pathname.startsWith('/pdfs/')

  if (isCookieGated) {
    const accessCookie = request.cookies.get('cm_access')
    if (!accessCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url), { status: 302 })
    }
  }

  // Permissive CSP for routes that iframe interactive HTML with inline scripts.
  const isPermissive =
    pathname.startsWith('/materials/viewer/') ||
    pathname.startsWith('/materials/mindmap/') ||
    (pathname.startsWith('/materials/') && pathname.split('/').filter(Boolean).length >= 3) ||
    (pathname.startsWith('/study/') && !pathname.startsWith('/study/daily-test')) ||
    pathname.startsWith('/content/') ||
    pathname.startsWith('/pdfs/')

  const csp = isPermissive ? buildPermissiveCsp() : buildStrictCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-csp',   csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('Content-Security-Policy', csp)

  // /study/, /content/, /pdfs/ are iframed by the viewer — allow same-origin framing.
  // All other routes deny framing.
  const isFrameable =
    (pathname.startsWith('/study/') && !pathname.startsWith('/study/daily-test')) ||
    pathname.startsWith('/content/') ||
    pathname.startsWith('/pdfs/')

  for (const [key, value] of STATIC_HEADERS) {
    if (key === 'X-Frame-Options') {
      response.headers.set(key, isFrameable ? 'SAMEORIGIN' : 'DENY')
    } else {
      response.headers.set(key, value)
    }
  }

  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

// ── Matcher ────────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
