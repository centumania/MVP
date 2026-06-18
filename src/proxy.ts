import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge Proxy — src/proxy.ts
 *
 * Next.js 16 uses "proxy.ts" as the edge middleware convention.
 *
 * Responsibilities:
 *  1. Nonce-based Content Security Policy (strict for all routes)
 *  2. Permissive CSP for /materials/mindmap/* routes — the iframe loads
 *     admin-uploaded interactive HTML which requires 'unsafe-inline',
 *     'unsafe-eval', CDN access, and localStorage (allow-same-origin).
 *  3. All security response headers (HSTS, X-Frame-Options, etc.)
 *  4. Server identity stripping
 */

// ── Strict CSP — all routes except mindmap viewer ──────────────────
function buildStrictCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com",
    // *.supabase.co: MindMap iframe loaded directly from Supabase Storage
    // blob: kept for backward compat, YouTube for video embeds
    "frame-src 'self' blob: https://*.supabase.co https://www.youtube-nocookie.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}

// ── Permissive CSP — /materials/mindmap/* only ─────────────────────
// The MindMap iframe uses allow-same-origin so it inherits this page's
// CSP. Admin-uploaded HTML files need inline scripts, eval (some graph
// libs), and external CDN assets. This route is auth-gated (payment
// verified), so the relaxed policy is acceptable.
function buildMindmapCsp(nonce: string): string {
  const directives: string[] = [
    "default-src 'self' https: data: blob:",
    // Allow inline + eval for graph/visualization libraries in the MindMap
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https: blob:`,
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

// ── Proxy entry point ──────────────────────────────────────────────
export function proxy(request: NextRequest): NextResponse {
  const nonce    = Buffer.from(crypto.randomUUID()).toString('base64')
  const pathname = request.nextUrl.pathname

  // Protect /study/*, /content/*, /pdfs/* — require the cm_access session cookie
  // set by /api/materials/status. Unauthenticated requests redirect to login.
  if (
    pathname.startsWith('/study/') ||
    pathname.startsWith('/content/') ||
    pathname.startsWith('/pdfs/')
  ) {
    const accessCookie = request.cookies.get('cm_access')
    if (!accessCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url), { status: 302 })
    }
  }

  // Use permissive CSP for the materials viewer so the sandboxed iframe
  // (which inherits this page's CSP via allow-same-origin) can run
  // interactive HTML including inline scripts and localStorage, and so
  // the client-side fetch() to the external html_url is allowed by connect-src.
  // Student viewer /materials/[studentId]/[day] also iframes study HTML with inline scripts.
  // /study/, /content/, /pdfs/ serve the HTML files themselves — they load CDN scripts
  // (e.g. Mermaid) and must have the permissive CSP or their inline JS is blocked.
  const isViewer = pathname.startsWith('/materials/viewer/') ||
                   pathname.startsWith('/materials/mindmap/') ||
                   (pathname.startsWith('/materials/') && pathname.split('/').filter(Boolean).length >= 3) ||
                   pathname.startsWith('/study/') ||
                   pathname.startsWith('/content/') ||
                   pathname.startsWith('/pdfs/')
  const csp      = isViewer ? buildMindmapCsp(nonce) : buildStrictCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-csp',   csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('Content-Security-Policy', csp)

  // Study/content files are iframed by the viewer — allow same-origin framing.
  // All other routes keep DENY.
  const isFrameable = pathname.startsWith('/study/') ||
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
