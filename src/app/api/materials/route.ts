/**
 * GET /api/materials
 *
 * Returns active study materials for the authenticated student.
 * Storage keys are NEVER returned. html_url is a public external link — safe to expose.
 *
 * Free preview policy:
 *   - Days 1 & 2 accessible to all logged-in users (no payment required).
 *   - Day 3+ requires payment_verified = true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
export const dynamic = 'force-dynamic'

const FREE_DAYS = 2

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('payment_verified, batch_id').eq('id', user.id).single()

    const isPaid = profile?.payment_verified === true

    const batchQuery = supabase.from('batches').select('id')
    const { data: batch } = await (
      profile?.batch_id
        ? batchQuery.eq('id', profile.batch_id).maybeSingle()
        : batchQuery.eq('is_active', true).limit(1).maybeSingle()
    )
    if (!batch) return NextResponse.json({ error: 'No active batch' }, { status: 404 })

    let query = supabase
      .from('materials')
      .select('id, day_number, title, html_url, pdf_key, test_link, published_at, expires_at')
      .eq('batch_id', batch.id)
      .gt('expires_at', new Date().toISOString())
      .order('day_number', { ascending: false })
      .order('created_at', { ascending: true })

    if (!isPaid) query = query.lte('day_number', FREE_DAYS)

    const { data: materials, error: matErr } = await query

    if (matErr) {
      console.error('[materials] Query failed:', matErr)
      return NextResponse.json({ error: 'Failed to load materials' }, { status: 500 })
    }

    if (!materials || materials.length === 0) {
      return isPaid
        ? NextResponse.json({ error: 'No materials available' }, { status: 404 })
        : NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    const safe = materials.map(m => ({
      id:          m.id,
      dayNumber:   m.day_number,
      title:       m.title,
      hasContent:  !!(m.html_url || m.pdf_key),
      testLink:    m.test_link,
      isFree:      m.day_number <= FREE_DAYS,
      publishedAt: m.published_at,
      expiresAt:   m.expires_at,
    }))

    return NextResponse.json({ materials: safe })

  } catch (err) {
    console.error('[materials] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
