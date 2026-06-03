'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'
import type { LeaderboardEntry, PricingTier } from '@/src/types/database'
import type { BadgeVariant } from '@/src/components/ui/Badge'

type LeaderboardData = {
  entries: LeaderboardEntry[]
  myRank:  LeaderboardEntry | null
  userId:  string
}

const TIER_BADGE: Record<PricingTier, { label: string; variant: BadgeVariant }> = {
  rookie:  { label: 'Rookie',  variant: 'neutral'  },
  warrior: { label: 'Warrior', variant: 'primary'  },
  legend:  { label: 'Legend',  variant: 'warning'  },
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const PODIUM_COLORS: Record<number, { bg: string; ring: string; text: string }> = {
  1: { bg: 'bg-amber-50',   ring: 'ring-amber-200',   text: 'text-amber-700'   },
  2: { bg: 'bg-slate-50',   ring: 'ring-slate-200',   text: 'text-slate-600'   },
  3: { bg: 'bg-orange-50',  ring: 'ring-orange-200',  text: 'text-orange-700'  },
}

function Avatar({ name, size = 'md', highlight = false }: { name: string; size?: 'sm' | 'md' | 'lg'; highlight?: boolean }) {
  const parts = name.trim().split(' ')
  const init  = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  const sz    = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center shrink-0 font-semibold uppercase ${
      highlight ? 'bg-primary text-white' : 'bg-primary-muted text-primary'
    }`}>
      {init}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) return <span className="text-xl">{MEDAL[rank]}</span>
  return (
    <span className="font-mono text-sm font-semibold text-text-muted w-8 text-center shrink-0">
      #{rank}
    </span>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data,      setData]     = useState<LeaderboardData | null>(null)
  const [userName,  setUserName] = useState<string>('')
  const [loading,   setLoading]  = useState(true)
  const [error,     setError]    = useState<string | null>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')

      const res = await fetch('/api/leaderboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 402) { router.replace('/dashboard'); return }
      if (!res.ok) { setError('Failed to load leaderboard.'); setLoading(false); return }
      setData(await res.json())
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} lines={2} avatar />)}
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-sm text-error">{error}</p>
        </div>
      </AppLayout>
    )
  }

  const { entries = [], myRank, userId } = data ?? {}
  const top3 = entries.slice(0, 3)
  const rest  = entries.slice(3)

  const myPercentile = myRank && entries.length > 0
    ? Math.round((1 - (myRank.rank - 1) / Math.max(entries.length, 1)) * 100)
    : null

  return (
    <AppLayout userName={userName}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text">Leaderboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">LDC Batch 2026 · Cumulative rankings · {entries.length} students</p>
        </div>

        {/* My rank card */}
        {myRank && (
          <div className="bg-navy rounded-2xl px-5 py-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-base font-mono">#{myRank.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">Your ranking</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-slate-400 text-xs font-mono">{myRank.total_score.toLocaleString()} pts</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 text-xs">{myRank.days_attended} days</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 text-xs">{myRank.accuracy_percent}% accuracy</span>
                </div>
              </div>
              {myPercentile !== null && (
                <div className="text-right shrink-0">
                  <p className="text-primary font-semibold text-sm">Top {100 - myPercentile + 1}%</p>
                  <p className="text-slate-500 text-xs mt-0.5">percentile</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Podium — top 3 */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 0, 2].map(i => {
              const e      = top3[i]
              if (!e) return <div key={i} />
              const isMe   = e.user_id === userId
              const colors = PODIUM_COLORS[e.rank] ?? PODIUM_COLORS[3]
              return (
                <div
                  key={e.user_id}
                  className={`${colors.bg} rounded-xl border ${colors.ring} ring-1 p-4 text-center ${i === 0 ? 'mt-4' : ''} ${isMe ? 'ring-primary' : ''}`}
                >
                  <div className="text-2xl mb-2">{MEDAL[e.rank]}</div>
                  <Avatar name={e.name} size={i === 0 ? 'lg' : 'md'} highlight={isMe} />
                  <p className={`text-xs font-semibold mt-2 truncate ${colors.text}`}>{e.name.split(' ')[0]}</p>
                  <p className="text-lg font-bold text-text mt-1 font-mono">{e.total_score.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted">pts</p>
                  {e.tier && (
                    <div className="mt-2">
                      <Badge variant={TIER_BADGE[e.tier]?.variant ?? 'neutral'} size="sm">
                        {TIER_BADGE[e.tier]?.label}
                      </Badge>
                    </div>
                  )}
                  {isMe && <p className="text-[10px] text-primary mt-1 font-medium">You</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* Full rankings */}
        {(top3.length < 3 ? entries : rest).length > 0 && (
          <Card noPadding>
            <div className="px-4 py-3 border-b border-border">
              <CardLabel>{top3.length >= 3 ? 'Rankings #4 and below' : 'All students'}</CardLabel>
            </div>
            <div className="divide-y divide-border">
              {(top3.length < 3 ? entries : rest).map((e, idx) => {
                const isMe   = e.user_id === userId
                const showPct = e.accuracy_percent > 0
                return (
                  <div
                    key={e.user_id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? 'bg-primary-subtle' : 'hover:bg-surface-overlay'}`}
                  >
                    <RankBadge rank={e.rank} />
                    <Avatar name={e.name} size="sm" highlight={isMe} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {e.name}
                        {isMe && <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-text-muted">{e.days_attended} days</span>
                        {showPct && (
                          <>
                            <span className="text-text-muted text-xs">·</span>
                            <span className="text-xs text-text-muted">{e.accuracy_percent}%</span>
                          </>
                        )}
                        {e.tier && (
                          <>
                            <span className="text-text-muted text-xs">·</span>
                            <Badge variant={TIER_BADGE[e.tier]?.variant ?? 'neutral'} size="sm">
                              {TIER_BADGE[e.tier]?.label}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text font-mono">{e.total_score.toLocaleString()}</p>
                      <p className="text-xs text-text-muted">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {entries.length === 0 && (
          <Card className="text-center py-14">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-sm font-medium text-text">No submissions yet</p>
            <p className="text-xs text-text-muted mt-1">Leaderboard updates after each exam submission.</p>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}
