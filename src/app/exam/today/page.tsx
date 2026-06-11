'use client'

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
      if (!res.ok) { router.replace('/dashboard'); return }
      const { dayNumber } = await res.json()
      router.replace(`/exam/${dayNumber}`)
    })
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#0e1410' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ADE80' }} />
      <p className="text-sm text-text-secondary">Loading today&apos;s exam…</p>
    </div>
  )
}
