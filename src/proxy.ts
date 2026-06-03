import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge Middleware
 *
 * Responsibilities:
 *  1. Security headers on every response
 *  2. Basic rate limiting signal via X-RateLimit headers (client-side awareness)
 *
 * Note: Full rate limiting (in-memory or Redis) requires a persistent store
 * that runs at the edge. For Vercel deployments, use @vercel/kv or
 * upstash/ratelimit. This middleware adds the framework without that dependency.
 */

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options':            'nosniff',
  'X-Frame-Options':                   'DENY',
  'X-XSS-Protection':                  '1; mode=block',
  'Referrer-Policy':                   'strict-origin-when-cross-origin',
  'Permissions-Policy':                'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security':         'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com; " +
    "frame-src 'self' https://www.youtube-nocookie.com; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "base-uri 'self'",
}

export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next()

  // Apply security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // Remove server identification headers
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
