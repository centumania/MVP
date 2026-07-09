'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { MCQCard } from '@/src/components/current-affairs/MCQCard'
import { LanguageToggle } from '@/src/components/current-affairs/LanguageToggle'
import type { Lang } from '@/src/components/current-affairs/LanguageToggle'
import type { CAIEAttempt, CAIEEventDetail, ImportanceLevel } from '@/src/lib/caie/types'

const IMPORTANCE_COLOR: Record<ImportanceLevel, string> = {
  Critical: '#EF4444',
  High:     '#F6B300',
  Medium:   '#0284c7',
  Low:      'rgba(255,255,255,0.4)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function EventDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [userName, setUserName] = useState('Student')
  const [token, setToken]   = useState<string | null>(null)
  const [detail, setDetail]   = useState<CAIEEventDetail | null>(null)
  const [state, setState]     = useState<'loading' | 'ready' | 'error' | 'unpaid'>('loading')
  const [lang, setLang]       = useState<Lang>('en')
  const [attemptsMap, setAttemptsMap] = useState<Map<string, CAIEAttempt>>(new Map())

  async function loadDetail(tok: string, language: Lang) {
    setState('loading')
    try {
      const qs  = language !== 'en' ? `?lang=${language}` : ''
      const res = await fetch(`/api/caie/events/${id}${qs}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.status === 403) { setState('unpaid'); return }
      if (res.status === 404) { setState('error');  return }
      if (!res.ok)            { setState('error');  return }
      const data: CAIEEventDetail = await res.json()
      setDetail(data)
      setState('ready')

      // Load prior attempts for all MCQs on this event (best-effort)
      if (data.mcqs.length > 0) {
        const ids = data.mcqs.map(m => m.id).join(',')
        fetch(`/api/caie/attempts?mcq_ids=${ids}`, { headers: { Authorization: `Bearer ${tok}` } })
          .then(r => r.ok ? r.json() : { data: [] })
          .then(({ data: attempts }: { data: CAIEAttempt[] }) => {
            const map = new Map(attempts.map(a => [a.mcq_id, a]))
            setAttemptsMap(map)
          })
          .catch(() => { /* non-critical */ })
      }
    } catch { setState('error') }
  }

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)
      setToken(session.access_token)
      loadDetail(session.access_token, 'en')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  const event = detail?.event
  const mcqs  = detail?.mcqs ?? []

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/current-affairs"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: '#6B7280' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Current Affairs
          </Link>
          <LanguageToggle
            value={lang}
            onChange={(l) => { setLang(l); if (token) loadDetail(token, l) }}
          />
        </div>

        {state === 'loading' && (
          <div className="space-y-4">
            <div className="h-8 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />
            <div className="h-4 w-2/3 rounded-lg animate-pulse" style={{ background: '#F9FAFB' }} />
            <div className="h-48 rounded-2xl animate-pulse" style={{ background: '#F9FAFB' }} />
          </div>
        )}

        {state === 'unpaid' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(246,179,0,0.08)', border: '1px solid rgba(246,179,0,0.2)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#F6B300' }}>
              Premium Feature
            </p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Current Affairs is available for enrolled students.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#EF4444' }}>
              Event not found
            </p>
            <Link href="/current-affairs" className="text-sm font-semibold" style={{ color: '#0284c7' }}>
              ← Back to events
            </Link>
          </div>
        )}

        {state === 'ready' && event && (
          <>
            {/* Meta */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1"
                style={{
                  color: IMPORTANCE_COLOR[event.importance],
                  background: `${IMPORTANCE_COLOR[event.importance]}18`,
                }}
              >
                {event.importance}
              </span>
              <span
                className="text-[10px] rounded px-2 py-0.5"
                style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7' }}
              >
                {event.category}
              </span>
              <span className="text-xs ml-auto" style={{ color: 'rgba(0,0,0,0.35)' }}>
                {formatDate(event.source_date)}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-xl font-bold leading-snug mb-3" style={{ color: '#111827' }}>
              {event.headline}
            </h1>

            {/* Summary */}
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {event.ultra_short_summary}
            </p>

            {/* Key Facts */}
            {event.key_facts && event.key_facts.length > 0 && (
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(37,51,255,0.06)', border: '1px solid rgba(2,132,199,0.10)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: '#0284c7' }}>
                  Key Facts
                </p>
                <ul className="space-y-2">
                  {event.key_facts.map((fact, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'rgba(0,0,0,0.65)' }}>
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: '#0284c7' }} />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Summary */}
            {event.detailed_summary && (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  Details
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
                  {event.detailed_summary}
                </p>
              </div>
            )}

            {/* Background */}
            {event.background && (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  Background
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  {event.background}
                </p>
              </div>
            )}

            {/* Source credibility */}
            <div className="flex items-center gap-4 mb-8 py-3 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'rgba(0,0,0,0.10)' }}>
                  Sources
                </p>
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>{event.source_count}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'rgba(0,0,0,0.10)' }}>
                  Trust Score
                </p>
                <p className="text-sm font-semibold" style={{ color: '#10B981' }}>
                  {Math.round(event.truth_score * 100)}%
                </p>
              </div>
            </div>

            {/* MCQ Section */}
            {mcqs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: '#111827' }}>
                  Practice MCQs ({mcqs.length})
                </h2>
                <div className="space-y-4">
                  {mcqs.map((mcq, i) => (
                    <MCQCard
                      key={mcq.id}
                      mcq={mcq}
                      index={i}
                      token={token ?? ''}
                      initialAttempt={attemptsMap.get(mcq.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {mcqs.length === 0 && (
              <div className="rounded-2xl p-6 text-center"
                style={{ background: '#FAFAFA', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  MCQs being generated — check back shortly.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
