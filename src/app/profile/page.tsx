'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string; name: string; email: string; phone: string | null
  tier: string | null; payment_verified: boolean; is_admin: boolean; created_at: string
}

type DashData = {
  paymentPending?: boolean
  xp: number; xpLevel: number; xpInLevel: number; xpToNext: number
  streak: number; daysAttended: number; batchTotalDays: number
  leaderboard: { rank: number; score: number; accuracy: number } | null
}

type Achievement = { id: string; title: string; desc: string; icon: string; earned: boolean }

function getAchievements(data: DashData | null): Achievement[] {
  if (!data) return []
  const d = data
  return [
    { id: 'first-exam',    title: 'First Exam',      desc: 'Complete your first exam',             icon: '🎯', earned: d.daysAttended >= 1 },
    { id: 'streak-3',      title: '3-Day Streak',     desc: '3 consecutive days',                   icon: '🔥', earned: d.streak >= 3 },
    { id: 'streak-7',      title: 'Week Warrior',     desc: '7 consecutive days',                   icon: '⚡', earned: d.streak >= 7 },
    { id: 'streak-14',     title: 'Fortnight',        desc: '14 consecutive days',                  icon: '💪', earned: d.streak >= 14 },
    { id: 'streak-25',     title: 'Perfect Batch',    desc: 'Complete all 25 days',                 icon: '🏆', earned: d.daysAttended >= 25 },
    { id: 'top-10',        title: 'Top 10',           desc: 'Reach the top 10 on the leaderboard', icon: '🥇', earned: (d.leaderboard?.rank ?? 999) <= 10 },
    { id: 'top-3',         title: 'Podium',           desc: 'Reach the top 3',                     icon: '🏅', earned: (d.leaderboard?.rank ?? 999) <= 3 },
    { id: 'xp-1000',       title: '1K XP',            desc: 'Earn 1,000 XP',                       icon: '⭐', earned: d.xp >= 1000 },
    { id: 'xp-5000',       title: '5K XP',            desc: 'Earn 5,000 XP',                       icon: '🌟', earned: d.xp >= 5000 },
    { id: 'accuracy-80',   title: 'Sharp Mind',       desc: '80%+ accuracy on the leaderboard',    icon: '🎓', earned: (d.leaderboard?.accuracy ?? 0) >= 80 },
  ]
}

export default function ProfilePage() {
  const router   = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dashData, setDashData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUser(session.user)

      const [{ data: p }, dashRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ])
      setProfile(p)
      if (dashRes.ok) setDashData(await dashRes.json())
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  const name     = profile?.name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Student'
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const achievements = getAchievements(dashData)
  const earnedCount  = achievements.filter(a => a.earned).length

  if (loading) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-overlay rounded-lg w-32" />
            <div className="h-32 bg-surface-overlay rounded-xl" />
            <div className="h-24 bg-surface-overlay rounded-xl" />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={name}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        <h1 className="text-2xl font-semibold text-text">Profile</h1>

        {/* Identity card */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-muted text-primary text-xl font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text">{name}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              {dashData && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md font-mono">
                    {dashData.xp.toLocaleString()} XP · Level {dashData.xpLevel}
                  </span>
                  {dashData.streak > 0 && (
                    <span className="text-xs text-warning bg-warning-subtle px-2 py-0.5 rounded-md">
                      🔥 {dashData.streak}d streak
                    </span>
                  )}
                </div>
              )}
            </div>
            {profile?.payment_verified
              ? <Badge variant="success" dot>Active</Badge>
              : <Badge variant="warning" dot>Pending</Badge>
            }
          </div>
        </Card>

        {/* Stats grid */}
        {dashData && !dashData.paymentPending && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rank',     value: dashData.leaderboard ? `#${dashData.leaderboard.rank}` : '—' },
              { label: 'Days',     value: `${dashData.daysAttended}/${dashData.batchTotalDays}` },
              { label: 'Accuracy', value: dashData.leaderboard ? `${dashData.leaderboard.accuracy}%` : '—' },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center">
                <p className="text-xl font-semibold text-text font-mono">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Account details */}
        <Card>
          <CardLabel className="mb-4">Account details</CardLabel>
          <div className="space-y-0">
            {[
              { label: 'Full name',    value: profile?.name ?? '—' },
              { label: 'Email',        value: user?.email ?? '—' },
              { label: 'Phone',        value: profile?.phone ?? '—' },
              { label: 'Batch tier',   value: profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Not assigned' },
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{label}</span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardLabel>Achievements</CardLabel>
            <span className="text-xs text-text-muted">{earnedCount} / {achievements.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {achievements.map(a => (
              <div
                key={a.id}
                className={`flex items-center gap-2.5 p-3 rounded-lg border ${
                  a.earned
                    ? 'bg-primary-subtle border-primary-border'
                    : 'bg-surface-overlay border-border opacity-50'
                }`}
              >
                <span className={`text-xl ${!a.earned && 'grayscale'}`}>{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text truncate">{a.title}</p>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Enrolment */}
        <Card>
          <CardLabel className="mb-3">Enrolment status</CardLabel>
          {profile?.payment_verified ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-subtle flex items-center justify-center">
                <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text">Payment verified</p>
                <p className="text-xs text-text-muted">Full access to all exams and materials.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning-subtle flex items-center justify-center">
                <svg className="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text">Payment pending</p>
                <p className="text-xs text-text-muted">Contact your coordinator to complete enrolment.</p>
              </div>
            </div>
          )}
        </Card>

        <Button variant="outline" onClick={handleLogout} fullWidth>Sign out</Button>
      </div>
    </AppLayout>
  )
}
