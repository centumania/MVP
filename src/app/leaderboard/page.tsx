'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'
import type { LeaderboardEntry, PricingTier } from '@/src/types/database'

type LeaderboardData = {
  entries: LeaderboardEntry[]
  myRank:  LeaderboardEntry | null
  userId:  string
}

const TIER_BADGE: Record<PricingTier, { label: string; variant: 'primary' | 'warning' | 'info' }> = {
  rookie:  { label: 'Rookie',  variant: 'neutral' as never },
  warrior: { label: 'Warrior', variant: 'primary' },
  legend:  { label: 'Legend',  variant: 'warning' },
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const init  = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-primary-muted text-primary text-sm font-semibold flex items-center justify-center shrink-0 uppercase">
      {init}
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data, setData]       = useState<LeaderboardData | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

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
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} lines={2} avatar />)}
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
  const rest = entries.slice(3)
  const myPercentile = myRank ? Math.round((1 - (myRank.rank - 1) / Math.max(entries.length, 1)) * 100) : null

  return (
    <AppLayout userName={userName}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-text">Leaderboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">LDC Batch 2026 · Cumulative rankings</p>
        </div>

        {/* My rank card */}
        {myRank && (
          <Card highlight>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-sm font-mono">#{myRank.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">Your rank</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-muted font-mono">{myRank.total_score} pts</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{myRank.days_attended} days</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{myRank.accuracy_percent}% accuracy</span>
                </div>
              </div>
              {myPercentile !== null && (
                <Badge variant="primary">Top {100 - myPercentile + 1}%</Badge>
              )}
            </div>
          </Card>
        )}

        {/* Podium — top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 0, 2].map(i => {
              const e = top3[i]
              if (!e) return <div key={i} />
              const isMe = e.user_id === userId
              return (
                <Card key={e.user_id} className={`text-center ${isMe ? 'border-primary ring-1 ring-primary' : ''}`}>
                  <div className="text-2xl mb-2">{MEDAL[e.rank]}</div>
                  <Initials name={e.name} />
                  <p className="text-xs font-medium text-text mt-2 truncate">{e.name.split(' ')[0]}</p>
                  <p className="text-lg font-semibold text-text mt-1 font-mono">{e.total_score}</p>
                  <p className="text-xs text-text-muted">points</p>
                  {e.tier && (
                    <div className="mt-2">
                      <Badge variant={TIER_BADGE[e.tier]?.variant ?? 'neutral'} size="sm">
                        {TIER_BADGE[e.tier]?.label ?? e.tier}
                      </Badge>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Full table */}
        {rest.length > 0 && (
          <Card noPadding>
            <div className="px-4 py-3 border-b border-border">
              <CardLabel>All students</CardLabel>
            </div>
            <div className="divide-y divide-border">
              {rest.map(e => {
                const isMe = e.user_id === userId
                return (
                  <div
                    key={e.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-primary-subtle' : 'hover:bg-surface-overlay'} transition-colors`}
                  >
                    <span className="text-sm font-mono text-text-muted w-8 shrink-0">#{e.rank}</span>
                    <Initials name={e.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {e.name} {isMe && <span className="text-xs text-primary font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-text-muted">{e.days_attended} days · {e.accuracy_percent}%</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text font-mono">{e.total_score}</p>
                      <p className="text-xs text-text-muted">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {entries.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-sm font-medium text-text">No results yet</p>
            <p className="text-xs text-text-muted mt-1">Leaderboard updates after each exam submission.</p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
