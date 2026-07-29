/**
 * GET /api/materials/open/[id]
 *
 * Auth + subscription gateway.
 *
 * type = 'html' → returns { url, type } — the raw hosted HTML URL.
 *                  The viewer iframes it directly so the page runs in its own
 *                  origin context (Netlify, etc.) and its JS/API calls work correctly.
 * type = 'pdf'  → returns { url, type } — 1-hour Supabase Storage signed URL.
 *
 * Response codes:
 *   200 — see above
 *   401 — not logged in
 *   402 — payment required (beyond free days)
 *   404 — material not found, expired, or has no content
 *   429 — rate limited
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { rateLimit } from '@/src/lib/rate-limit'
import { getMaterialById } from '@/src/data/materials'

export const dynamic = 'force-dynamic'

const FREE_DAYS = 2
const BUCKET    = 'centumania-materials'
const PDF_TTL   = 60 * 60 // 1-hour signed URL

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('[materials/open] Auth failed:', authError?.message, 'token prefix:', token?.slice(0, 20))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 30 opens per user per 10 minutes
    const limiter = await rateLimit(`materials-open:${user.id}`, { limit: 30, window: '10 m' })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before opening more materials.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limiter.reset - Date.now()) / 1000)) } },
      )
    }

    // Entitlement, read once: it both gates this response and refreshes the
    // cm_access cookie below. The viewer opens a module through this route and
    // nothing else, so this is the only place that can keep a student's cookie
    // in step with their access before the iframe requests the static file.
    const { data: profileRow } = await supabase
      .from('profiles').select('payment_verified').eq('id', user.id).single()
    const paymentVerified = profileRow?.payment_verified === true

    /** Attaches the entitlement cookie middleware reads when serving /study files. */
    const withAccessCookie = (res: NextResponse) => {
      res.cookies.set('cm_access', paymentVerified ? 'paid' : 'free', {
        httpOnly: true,
        maxAge: 60 * 60,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      return res
    }

    // ── Static-catalog modules (programs.ts pool): slug ids served from
    //    /public/study, never expire. Day-1 preview + the daily test engine are
    //    free; later days need payment. Checked BEFORE the DB so slug ids never
    //    fall through to the uuid lookup and 404.
    const staticMat = getMaterialById(id)
    if (staticMat) {
      const alwaysFree = id === 'daily-test-engine'
      if (!alwaysFree && staticMat.day > FREE_DAYS && !paymentVerified) {
        return withAccessCookie(NextResponse.json({ error: 'Payment required' }, { status: 402 }))
      }
      return withAccessCookie(NextResponse.json({ url: staticMat.htmlPath, type: 'html' }))
    }

    const now = new Date().toISOString()
    const { data: material } = await supabase
      .from('materials')
      .select('html_url, pdf_key, day_number, expires_at')
      .eq('id', id)
      .gt('expires_at', now)
      .maybeSingle()

    if (!material || (!material.html_url && !material.pdf_key)) {
      console.error('[materials/open] Not found. id:', id, 'now:', now)
      return NextResponse.json({ error: 'Material not found or expired' }, { status: 404 })
    }

    // Payment gate for content beyond free days
    if (material.day_number > FREE_DAYS && !paymentVerified) {
      return withAccessCookie(NextResponse.json({ error: 'Payment required' }, { status: 402 }))
    }

    // ── PDF: generate a short-lived signed URL ──────────────────────────────
    if (material.pdf_key) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(material.pdf_key, PDF_TTL)

      if (signErr || !signed?.signedUrl) {
        console.error('[materials/open] Failed to generate signed URL:', signErr)
        return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
      }

      return withAccessCookie(NextResponse.json({ url: signed.signedUrl, type: 'pdf' }))
    }

    return withAccessCookie(NextResponse.json({ url: material.html_url, type: 'html' }))

  } catch (err) {
    console.error('[materials/open] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
