'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { MCQCard } from '@/src/components/current-affairs/MCQCard'
import type { CAIEMCQ, CAIERevisionResponse } from '@/src/lib/caie/types'

export default function RevisionPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('Student')
  const [token, setToken] = useState<string | null>(null)
  const [mcqs, setMcqs]   = useState<CAIEMCQ[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error' | 'unpaid'>('loading')

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)
      setToken(session.access_token)

      try {
        const res = await fetch('/api/caie/attempts/revision', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.status === 403) { setState('unpaid'); return }
        if (!res.ok)            { setState('error');  return }
        const data: CAIERevisionResponse = await res.json()
        setMcqs(data.data)
        setState(data.data.length === 0 ? 'empty' : 'ready')
      } catch { setState('error') }
    })
  }, [router])

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <div className="mb-6">
          <Link
            href="/current-affairs/progress"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: '#6B7280' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            My Progress
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#111827' }}>
          Revision Queue
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Questions you got wrong — answer again to clear them from the queue
        </p>

        {state === 'loading' && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl h-48 animate-pulse"
                style={{ background: '#F9FAFB' }} />
            ))}
          </div>
        )}

        {state === 'unpaid' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(246,179,0,0.08)', border: '1px solid rgba(246,179,0,0.2)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#F6B300' }}>
              Premium Feature
            </p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Revision is available for enrolled students.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold" style={{ color: '#EF4444' }}>Failed to load</p>
          </div>
        )}

        {state === 'empty' && (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#10B981' }}>
              All clear! 🎯
            </p>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              No wrong answers to revise. Keep practicing on new events.
            </p>
            <Link
              href="/current-affairs"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#0284c7', color: '#fff' }}
            >
              Browse events
            </Link>
          </div>
        )}

        {state === 'ready' && token && (
          <>
            <p className="text-xs mb-3" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {mcqs.length} question{mcqs.length === 1 ? '' : 's'} to revise
            </p>
            <div className="space-y-4">
              {mcqs.map((mcq, i) => (
                <MCQCard key={mcq.id} mcq={mcq} index={i} token={token} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
