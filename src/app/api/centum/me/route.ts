/**
 * GET /api/centum/me
 *
 * Returns the authenticated student's own Centum Index data:
 *   - today's score (from centum_index_log)
 *   - last 7 days history
 *
 * Student-facing — no admin required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = getTodayInIST()

  const [{ data: todayRow }, { data: history }] = await Promise.all([
    supabase
      .from('centum_index_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('calculated_date', today)
      .maybeSingle(),
    supabase
      .from('centum_index_log')
      .select('*')
      .eq('user_id', user.id)
      .order('calculated_date', { ascending: false })
      .limit(7),
  ])

  return NextResponse.json({
    today:   todayRow ?? null,
    history: history  ?? [],
  })
}
