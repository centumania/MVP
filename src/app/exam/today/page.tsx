'use client'

/**
 * /exam/today — Smart redirect to today's actual exam URL.
 *
 * The sidebar links here for simplicity. This page resolves the
 * current day number and redirects to /exam/[day].
 *
 * If no exam exists today (window closed, no schedule), redirect
 * to dashboard with context.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

export default function ExamTodayPage() {
  const router = useRouter()

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }

      const res = await fetch('/api/exam/today', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { router.replace('/dashboard');  return }

      if (!res.ok) {
        // No exam today — fall back to dashboard
        router.replace('/dashboard')
        return
      }

      const { dayNumber } = await res.json()
      router.replace(`/exam/${dayNumber}`)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary">Loading today&apos;s exam…</p>
    </div>
  )
}
