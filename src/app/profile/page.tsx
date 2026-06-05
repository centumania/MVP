'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { ProgressRing } from '@/src/components/ui/ProgressRing'
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
type Achievement = { id: string; title: string; desc: string; icon: string; earned: boolean; category: 'streak'|'rank'|'xp'|'completion' }

function getAchievements(data: DashData | null): Achievement[] {
  if (!data) return []
  return [
    { id: 'first-exam',  title: 'First Step',   desc: 'Complete your first exam',     icon: '🎯', earned: data.daysAttended >= 1,                 category: 'completion' },
    { id: 'streak-3',    title: '3-Day Fire',    desc: '3 consecutive days',           icon: '🔥', earned: data.streak >= 3,                      category: 'streak'     },
    { id: 'streak-7',    title: 'Week Warrior',  desc: '7 consecutive days',           icon: '⚡', earned: data.streak >= 7,                      category: 'streak'     },
    { id: 'streak-14',   title: 'Fortnight',     desc: '14 consecutive days',          icon: '💪', earned: data.streak >= 14,                     category: 'streak'     },
    { id: 'streak-25',   title: 'Iron Will',     desc: 'Complete all 25 days',         icon: '🏆', earned: data.daysAttended >= 25,               category: 'completion' },
    { id: 'top-10',      title: 'Top 10',        desc: 'Reach top 10 on leaderboard',  icon: '🥇', earned: (data.leaderboard?.rank ?? 999) <= 10, category: 'rank'       },
    { id: 'top-3',       title: 'Podium',        desc: 'Reach the top 3',              icon: '🏅', earned: (data.leaderboard?.rank ?? 999) <= 3,  category: 'rank'       },
    { id: 'xp-1000',     title: '1K XP',         desc: 'Earn 1,000 XP',               icon: '⭐', earned: data.xp >= 1000,                       category: 'xp'         },
    { id: 'xp-5000',     title: '5K XP',         desc: 'Earn 5,000 XP',               icon: '🌟', earned: data.xp >= 5000,                       category: 'xp'         },
    { id: 'accuracy-80', title: 'Sharp Mind',    desc: '80%+ average accuracy',        icon: '🎓', earned: (data.leaderboard?.accuracy ?? 0) >= 80, category: 'rank'     },
  ]
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [dashData, setDashData] = useState<DashData | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUser(session.user)
      // Use API for profile data — avoids browser-client RLS race conditions
      const [profileRes, dashRes] = await Promise.all([
        fetch('/api/profile', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ])
      if (profileRes.ok) setProfile(await profileRes.json())
      if (dashRes.ok)    setDashData(await dashRes.json())
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
  const xpPct = dashData ? Math.round((dashData.xpInLevel / dashData.xpToNext) * 100) : 0

  if (loading) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-32 rounded-2xl" style={{ background: '#16201a' }} />
          <div className="h-24 rounded-2xl" style={{ background: '#16201a' }} />
          <div className="h-48 rounded-2xl" style={{ background: '#16201a' }} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={name}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        <h1 className="text-2xl font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Profile
        </h1>

        {/* ── Identity Card ───────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden p-5"
          style={{ background: 'linear-gradient(135deg,#112215,#0d1c10)', border: '1px solid rgba(111,207,143,0.12)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-15"
            style={{ background: 'radial-gradient(circle,#6fcf8f,transparent 70%)' }} />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <ProgressRing value={xpPct} size={64} strokeWidth={3} color="#6fcf8f" trackColor="rgba(111,207,143,0.10)" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#6fcf8f,#3fae6a)', color: '#06140c' }}>
                  {initials}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                {name}
              </p>
              <p className="text-sm text-text-muted truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {dashData && (
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono"
                    style={{ background: 'rgba(111,207,143,0.10)', border: '1px solid rgba(111,207,143,0.20)' }}>
                    Level {dashData.xpLevel} · {dashData.xp.toLocaleString()} XP
                  </span>
                )}
                {dashData && dashData.streak > 0 && (
                  <span className="text-[10px] font-bold text-warning px-2 py-0.5 rounded-lg font-mono"
                    style={{ background: 'rgba(231,177,76,0.10)', border: '1px solid rgba(231,177,76,0.20)' }}>
                    🔥 {dashData.streak}d streak
                  </span>
                )}
              </div>
            </div>
            {profile?.payment_verified
              ? <Badge variant="success" dot>Active</Badge>
              : <Badge variant="warning" dot>Pending</Badge>
            }
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────── */}
        {dashData && !dashData.paymentPending && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rank',     value: dashData.leaderboard ? `#${dashData.leaderboard.rank}` : '—' },
              { label: 'Days',     value: `${dashData.daysAttended}/${dashData.batchTotalDays}` },
              { label: 'Accuracy', value: dashData.leaderboard ? `${dashData.leaderboard.accuracy}%` : '—' },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center py-4">
                <p className="text-2xl font-bold text-text font-mono tracking-tight">{value}</p>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mt-1 font-mono">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* ── Account Details ─────────────────────────────────────── */}
        <Card>
          <CardLabel className="mb-4">Account</CardLabel>
          <div>
            {[
              { label: 'Full name',    value: profile?.name ?? '—' },
              { label: 'Email',        value: user?.email ?? '—' },
              { label: 'Phone',        value: profile?.phone ?? '—' },
              { label: 'Batch tier',   value: profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Not assigned' },
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-sm text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Achievements ────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <CardLabel>Achievements</CardLabel>
            <span className="text-xs font-bold text-primary font-mono">{earnedCount}/{achievements.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {achievements.map(a => (
              <div
                key={a.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all`}
                style={a.earned
                  ? { border: '1px solid rgba(231,177,76,0.25)', background: 'rgba(231,177,76,0.06)', boxShadow: '0 0 12px rgba(231,177,76,0.10)' }
                  : { border: '1px solid #27342b', background: '#1b271f', opacity: 0.4 }
                }
              >
                <span className={`text-xl shrink-0 ${!a.earned && 'grayscale'}`}>{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text leading-tight truncate">{a.title}</p>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Enrolment Status ─────────────────────────────────────── */}
        <Card>
          <CardLabel className="mb-3">Enrolment</CardLabel>
          {profile?.payment_verified ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(111,207,143,0.10)', border: '1px solid rgba(111,207,143,0.20)' }}>
                <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Payment verified</p>
                <p className="text-xs text-text-muted">Full access to all exams and materials.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(231,177,76,0.10)', border: '1px solid rgba(231,177,76,0.20)' }}>
                <svg className="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Payment pending</p>
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
