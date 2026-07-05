'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken } from '@/src/lib/analytics/track'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { InsightsCard, type InsightsData } from '@/src/components/dashboard/InsightsCard'

const TIER_COLOR: Record<string, string> = {
  critical: '#EF4444',
  weak:     '#F59E0B',
  moderate: '#2563EB',
  strong:   '#22C55E',
}

const TIER_LABEL: Record<string, string> = {
  critical: 'Critical',
  weak:     'Weak',
  moderate: 'Moderate',
  strong:   'Strong',
}

export default function InsightsPage() {
  const router = useRouter()
  const [name,     setName]     = useState('Student')
  const [insights, setInsights] = useState<InsightsData>(null)
  const [state,    setState]    = useState<'loading' | 'ready'>('loading')

  const fetchInsights = useCallback(async (token: string) => {
    const res = await fetch('/api/insights', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setInsights(await res.json())
    setState('ready')
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? 'Student')
      setCachedToken(session.access_token)
      fetchInsights(session.access_token)
    })
  }, [router, fetchInsights])

  const topics = insights?.profile?.topics ?? []

  return (
    <AppLayout userName={name}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Header */}
        <div className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-text-muted">
            Personalised
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            AI Insights
          </h1>
          <p className="text-xs mt-1 text-text-muted">
            Your topic-by-topic performance, analysed by AI
          </p>
        </div>

        {/* Summary card */}
        <InsightsCard data={state === 'loading' ? null : insights} />

        {/* Full topic breakdown table */}
        {insights?.hasData && topics.length > 0 && (
          <Card noPadding>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <CardLabel>All topics</CardLabel>
              <span className="text-[10px] font-mono text-text-muted">{topics.length} tracked</span>
            </div>
            <div>
              {topics.map((t, i) => {
                const col = TIER_COLOR[t.tier] ?? '#9CA3AF'
                return (
                  <div key={t.topic}
                    className="flex items-center gap-4 px-5 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>

                    {/* Tier dot */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />

                    {/* Topic name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{t.topic}</p>
                      <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-widest"
                        style={{ color: col }}>
                        {TIER_LABEL[t.tier]}
                      </p>
                    </div>

                    {/* Accuracy bar + pct */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg2)' }}>
                        <div className="h-full rounded-full" style={{ width: `${t.accuracyPct}%`, background: col }} />
                      </div>
                      <span className="text-sm font-bold font-mono w-10 text-right" style={{ color: col }}>
                        {t.accuracyPct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* What these tiers mean */}
        <Card>
          <CardLabel className="mb-3">What do these mean?</CardLabel>
          <div className="space-y-2.5">
            {[
              { tier: 'critical', range: 'Below 50%', action: 'Study this topic from scratch. Do not skip.' },
              { tier: 'weak',     range: '50 – 69%',  action: 'Review notes and attempt more questions.' },
              { tier: 'moderate', range: '70 – 84%',  action: 'Good progress. A few more rounds to solidify.' },
              { tier: 'strong',   range: '85%+',      action: 'Well done! Maintain with occasional revision.' },
            ].map(({ tier, range, action }) => (
              <div key={tier} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TIER_COLOR[tier] }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: TIER_COLOR[tier] }}>
                    {TIER_LABEL[tier]} · {range}
                  </p>
                  <p className="text-xs mt-0.5 text-text-muted">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </AppLayout>
  )
}
