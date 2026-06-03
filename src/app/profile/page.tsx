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

export default function ProfilePage() {
  const router   = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUser(session.user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data)
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  const name     = profile?.name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Student'
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  if (loading) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-overlay rounded-lg w-32" />
            <div className="h-32 bg-surface-overlay rounded-xl" />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={name}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        <h1 className="text-2xl font-semibold text-text">Profile</h1>

        {/* Avatar + name */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-muted text-primary text-xl font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text">{name}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
            </div>
            {profile?.payment_verified
              ? <Badge variant="success" dot>Active</Badge>
              : <Badge variant="warning" dot>Pending</Badge>
            }
          </div>
        </Card>

        {/* Details */}
        <Card>
          <CardLabel className="mb-4">Account details</CardLabel>
          <div className="space-y-3">
            {[
              { label: 'Full name',  value: profile?.name ?? '—' },
              { label: 'Email',      value: user?.email ?? '—' },
              { label: 'Phone',      value: profile?.phone ?? '—' },
              { label: 'Batch tier', value: profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Not assigned' },
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{label}</span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment status */}
        <Card>
          <CardLabel className="mb-3">Enrolment status</CardLabel>
          {profile?.payment_verified ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-subtle flex items-center justify-center">
                <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text">Payment verified</p>
                <p className="text-xs text-text-muted">Full access to all exams and materials.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning-subtle flex items-center justify-center">
                <svg className="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text">Payment pending</p>
                <p className="text-xs text-text-muted">Contact your coordinator to complete enrolment.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Sign out */}
        <Button variant="outline" onClick={handleLogout} fullWidth>
          Sign out
        </Button>
      </div>
    </AppLayout>
  )
}
