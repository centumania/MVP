'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'
import type { StudyLeaderboardEntry, PricingTier } from '@/src/types/database'
import type { BadgeVariant } from '@/src/components/ui/Badge'

type LeaderboardData = {
  entries: StudyLeaderboardEntry[]
  myRank:  StudyLeaderboardEntry | null
  userId:  string
}
const TIER_BADGE: Record<PricingTier, { label: string; variant: BadgeVariant }> = {
  rookie:  { label: 'Rookie',  variant: 'neutral' },
  warrior: { label: 'Warrior', variant: 'primary' },
  legend:  { label: 'Legend',  variant: 'gold'    },
}

// Green-palette podium metals
const METAL = {
  1: { grad: 'linear-gradient(135deg,#F59E0B 0%,#c98c1e 60%,#8b6110 100%)', glow: 'rgba(245,158,11,0.25)',  text: '#f5d48a', border: 'rgba(245,158,11,0.30)'  },
  2: { grad: 'linear-gradient(135deg,#d0d8c8 0%,#6B7280 60%,#9CA3AF 100%)', glow: 'rgba(154,168,147,0.20)', text: '#d0d8c8', border: 'rgba(154,168,147,0.25)' },
  3: { grad: 'linear-gradient(135deg,#a37a50 0%,#7a5030 60%,#4a3018 100%)', glow: 'rgba(163,122,80,0.20)',  text: '#d4ad8a', border: 'rgba(163,122,80,0.30)'  },
} as Record<number, { grad: string; glow: string; text: string; border: string }>

function CrownIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20l-2-10-5 5-3-8-3 8-5-5-2 10z"/></svg>
}

function Avatar({ name, isMe, size = 'md' }: { name: string; isMe?: boolean; size?: 'sm'|'md'|'lg' }) {
  const parts = name.trim().split(' ')
  const init  = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  const sz    = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center shrink-0 font-bold uppercase`}
      style={isMe
        ? { background: 'linear-gradient(135deg,#0B3D91,#10B981)', color: '#FFFFFF', boxShadow: '0 0 12px rgba(11,61,145,0.4)' }
        : { background: 'rgba(11,61,145,0.10)', color: '#0B3D91' }
      }>
      {init}
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data, setData]         = useState<LeaderboardData | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')
      const res = await fetch('/api/study/leaderboard', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.status === 402) { router.replace('/dashboard'); return }
      if (!res.ok) { setError('Failed to load leaderboard.'); setLoading(false); return }
      setData(await res.json())
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} lines={2} avatar />)}
      </div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 py-8"><p className="text-sm text-error">{error}</p></div>
    </AppLayout>
  )

  const { entries = [], myRank } = data ?? {}
  const isMe = (e: StudyLeaderboardEntry): boolean => !!myRank && e.rank === myRank.rank
  const top3 = entries.slice(0, 3)
  const rest  = entries.slice(3)
  const myPercentile = myRank && entries.length > 0
    ? Math.round((1 - (myRank.rank - 1) / Math.max(entries.length, 1)) * 100)
    : null

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Leaderboard
          </h1>
        </div>

        {/* My Rank Banner */}
        {myRank && (
          <div className="relative rounded-2xl overflow-hidden px-5 py-4"
            style={{ background: 'linear-gradient(135deg,#112215,#0d1c10)', border: '1px solid rgba(11,61,145,0.20)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at left,rgba(11,61,145,0.08),transparent 60%)' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm font-mono"
                style={{ background: 'rgba(11,61,145,0.12)', border: '1px solid rgba(11,61,145,0.25)', color: '#0B3D91' }}>
                #{myRank.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text">Your ranking</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-mono text-text-muted">{myRank.total_score.toLocaleString()} pts</span>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-xs text-text-muted">{myRank.days_attended} days</span>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-xs text-text-muted">{myRank.accuracy_percent}% accuracy</span>
                </div>
              </div>
              {myPercentile !== null && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">Top {100 - myPercentile + 1}%</p>
                  <p className="text-[10px] text-text-muted mt-0.5">percentile</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PODIUM — Top 3 */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {[1, 0, 2].map(i => {
              const e = top3[i]
              if (!e) return <div key={i} />
              const m = METAL[e.rank]
              const isMeEntry = isMe(e)
              const isFirst = e.rank === 1
              return (
                <div key={e.rank}
                  className={`relative rounded-2xl overflow-hidden p-4 text-center ${isFirst ? 'pb-5 pt-6' : 'py-4'}`}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${m.border}`,
                    boxShadow: isMeEntry ? `0 0 20px ${m.glow}, 0 0 0 2px rgba(11,61,145,0.3)` : `0 0 12px ${m.glow}`,
                  }}
                >
                  {isFirst && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2" style={{ color: '#F59E0B' }}>
                      <CrownIcon size={14} />
                    </div>
                  )}
                  <div className="text-xl font-bold mb-2"
                    style={{ background: m.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    #{e.rank}
                  </div>
                  <Avatar name={e.name} isMe={isMeEntry} size={isFirst ? 'lg' : 'md'} />
                  <p className="text-base font-bold font-mono mt-2.5 tracking-tight" style={{ color: m.text }}>
                    {e.total_score.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono">pts</p>
                  {e.tier && (
                    <div className="mt-2 flex justify-center">
                      <Badge variant={TIER_BADGE[e.tier]?.variant ?? 'neutral'} size="sm">
                        {TIER_BADGE[e.tier]?.label}
                      </Badge>
                    </div>
                  )}
                  {isMeEntry && <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider font-mono">You</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* RANKINGS TABLE */}
        {(top3.length < 3 ? entries : rest).length > 0 && (
          <Card noPadding>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <CardLabel>{top3.length >= 3 ? 'Rankings — #4 and below' : 'All students'}</CardLabel>
            </div>
            <div>
              {(top3.length < 3 ? entries : rest).map((e, idx) => {
                const isMeEntry = isMe(e)
                return (
                  <div key={e.rank}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      borderBottom: idx < (top3.length < 3 ? entries : rest).length - 1 ? '1px solid rgba(229,231,235,0.5)' : undefined,
                      background: isMeEntry ? 'rgba(11,61,145,0.05)' : undefined,
                    }}
                  >
                    <span className="text-xs font-mono text-text-muted w-8 text-center shrink-0 font-semibold">
                      #{e.rank}
                    </span>
                    <Avatar name={e.name} isMe={isMeEntry} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-text-muted font-mono">
                        {e.days_attended} days · {e.accuracy_percent}% accuracy
                        {isMeEntry && <span className="ml-1.5 text-primary font-bold uppercase tracking-wider">(you)</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-text font-mono">{e.total_score.toLocaleString()}</p>
                      <p className="text-[10px] text-text-muted font-mono">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {entries.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <svg className="w-7 h-7 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-secondary">No results yet</p>
              <p className="text-xs text-text-muted mt-1">Rankings update after each exam submission.</p>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
