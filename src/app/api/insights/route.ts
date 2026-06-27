import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Tier = 'critical' | 'weak' | 'moderate' | 'strong'

function classifyTier(pct: number, attempted: number): Tier {
  if (attempted < 5) return 'strong'
  if (pct < 50)      return 'critical'
  if (pct < 70)      return 'weak'
  if (pct < 85)      return 'moderate'
  return 'strong'
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rows, error } = await supabase
      .from('student_topic_accuracy')
      .select('topic, total_attempted, total_correct')
      .eq('user_id', user.id)
      .order('total_attempted', { ascending: false })

    // Table doesn't exist yet — migrations not yet run on this environment
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ available: false, hasData: false, profile: null })
    }
    if (error) {
      console.error('[insights]', error.message)
      return NextResponse.json({ available: false, hasData: false, profile: null })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ available: true, hasData: false, profile: null })
    }

    const topics = rows.map(r => {
      const pct  = r.total_attempted > 0 ? Math.round((r.total_correct / r.total_attempted) * 100) : 0
      const tier = classifyTier(pct, r.total_attempted)
      return { topic: r.topic, accuracyPct: pct, totalAttempted: r.total_attempted, tier }
    })

    const byTier: Record<Tier, string[]> = { critical: [], weak: [], moderate: [], strong: [] }
    for (const t of topics) byTier[t.tier].push(t.topic)

    return NextResponse.json({ available: true, hasData: true, profile: { topics, ...byTier } })
  } catch (e) {
    console.error('[insights] unexpected:', e)
    return NextResponse.json({ available: false, hasData: false, profile: null })
  }
}
