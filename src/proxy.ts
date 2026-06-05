import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge Proxy — src/proxy.ts
 *
 * Next.js 16 uses "proxy.ts" as the edge middleware convention.
 * ("middleware.ts" is deprecated in Next.js 16 — see terminal warning.)
 *
 * Responsibilities:
 *  1. Nonce-based Content Security Policy
 *     - Development: allows 'unsafe-eval' (required by React DevTools + Turbopack)
 *     - Production:  strict — no 'unsafe-eval', no 'unsafe-inline' on script-src
 *  2. All security response headers (HSTS, X-Frame-Options, etc.)
 *  3. Server identity stripping (X-Powered-By, Server)
 *
 * Rate limiting is handled per-route in src/lib/rate-limit.ts, not here,
 * so individual endpoints can have different windows without adding latency
 * on every public route (e.g. /api/exam/window is called unauthenticated).
 */

// ── CSP builder ────────────────────────────────────────────────────
function buildCsp(nonce: string): string {
  // React's dev tools and Next.js Turbopack use eval() for better error
  // messages and source maps. In production, eval() is never needed.
  const isDev = process.env.NODE_ENV === 'development'

  const directives: string[] = [
    "default-src 'self'",

    // Scripts: nonce + strict-dynamic for Next.js code-splitting.
    // unsafe-eval only in development (React DevTools / Turbopack).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,

    // Styles: unsafe-inline needed because React's style={} JSX prop
    // compiles to HTML style="" attributes, which CSP style-src covers.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Fonts: next/font/google self-hosts at build time; keep gstatic
    // for any browser that still hits the CDN.
    "font-src 'self' data: https://fonts.gstatic.com",

    // Images: data: for base64, blob: for canvas, https: for external.
    "img-src 'self' data: blob: https:",

    // API calls + Supabase realtime websockets.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com",

    // Embeds: YouTube privacy-enhanced domain only.
    "frame-src 'self' https://www.youtube-nocookie.com",

    // Audio/video
    "media-src 'self' blob:",

    // Block plugins entirely.
    "object-src 'none'",

    // Prevent base-tag hijacking.
    "base-uri 'self'",

    // Restrict form submission targets.
    "form-action 'self'",

    // Force HTTPS for all subresources.
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}

// ── Static security headers ────────────────────────────────────────
const STATIC_HEADERS: [string, string][] = [
  ['X-Content-Type-Options',    'nosniff'],
  ['X-Frame-Options',           'DENY'],
  ['Referrer-Policy',           'strict-origin-when-cross-origin'],
  ['Permissions-Policy',        'camera=(), microphone=(), geolocation=(), payment=()'],
  // 2-year HSTS with preload. Safe for Vercel (always HTTPS).
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
]

// ── Proxy entry point (Next.js 16 convention) ──────────────────────
export function proxy(request: NextRequest): NextResponse {
  // Per-request nonce — cryptographically random, base64-encoded.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp   = buildCsp(nonce)

  // Forward nonce to the app via request header.
  // layout.tsx reads it server-side and sets <html nonce={nonce}>,
  // which tells Next.js to propagate it to all inline scripts it generates.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-csp',   csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Apply CSP
  response.headers.set('Content-Security-Policy', csp)

  // Apply all static security headers
  for (const [key, value] of STATIC_HEADERS) {
    response.headers.set(key, value)
  }

  // Remove server fingerprinting headers
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

// ── Matcher ────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match everything EXCEPT:
     *   _next/static   — built JS/CSS bundles
     *   _next/image    — image optimisation pipeline
     *   favicon.ico
     *   Static file extensions (.svg .png .jpg .jpeg .gif .webp .ico)
     *
     * /api/* IS matched — all API routes receive security headers.
     * MindMap HTML is served via /api/materials/mindmap/[id], not /public.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
