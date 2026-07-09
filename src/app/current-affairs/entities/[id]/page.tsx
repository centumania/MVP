'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import type { CAIEEntityDetail, ImportanceLevel } from '@/src/lib/caie/types'

const IMPORTANCE_COLOR: Record<ImportanceLevel, string> = {
  Critical: '#EF4444',
  High:     '#F6B300',
  Medium:   '#0284c7',
  Low:      'rgba(255,255,255,0.4)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EntityDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [userName, setUserName] = useState('Student')
  const [detail, setDetail] = useState<CAIEEntityDetail | null>(null)
  const [state, setState]   = useState<'loading' | 'ready' | 'error' | 'unpaid'>('loading')

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)

      try {
        const res = await fetch(`/api/caie/entities/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.status === 403) { setState('unpaid'); return }
        if (!res.ok)            { setState('error');  return }
        setDetail(await res.json())
        setState('ready')
      } catch { setState('error') }
    })
  }, [id, router])

  const entity = detail?.entity
  const events = detail?.events ?? []

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <div className="mb-6">
          <Link
            href="/current-affairs/entities"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: '#6B7280' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Knowledge Explorer
          </Link>
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
              Knowledge Explorer is available for enrolled students.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#EF4444' }}>
              Entity not found
            </p>
            <Link href="/current-affairs/entities" className="text-sm font-semibold" style={{ color: '#0284c7' }}>
              ← Back to explorer
            </Link>
          </div>
        )}

        {state === 'ready' && entity && (
          <>
            {/* Entity header */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-xl font-bold leading-snug" style={{ color: '#111827' }}>
                {entity.name}
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 capitalize"
                style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7' }}
              >
                {entity.entity_type.replace(/_/g, ' ')}
              </span>
            </div>

            {entity.description && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4B5563' }}>
                {entity.description}
              </p>
            )}

            {entity.aliases.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: 'rgba(0,0,0,0.10)' }}>
                  Also known as
                </span>
                {entity.aliases.map(alias => (
                  <span
                    key={alias}
                    className="text-[11px] rounded px-2 py-0.5"
                    style={{ background: '#F3F4F6', color: '#6B7280' }}
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}

            {/* Linked events */}
            <h2 className="text-xl font-bold tracking-tight mb-4" style={{ color: '#111827' }}>
              In the News ({events.length})
            </h2>

            {events.length === 0 && (
              <div className="rounded-2xl p-6 text-center"
                style={{ background: '#FAFAFA', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  No published events linked yet.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {events.map(event => (
                <Link key={event.id} href={`/current-affairs/${event.id}`} className="block group">
                  <div
                    className="rounded-2xl p-4 transition-all duration-150 group-hover:translate-y-[-1px]"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
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
                      <span className="text-[11px] ml-auto" style={{ color: 'rgba(0,0,0,0.35)' }}>
                        {formatDate(event.source_date)}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#111827' }}>
                      {event.headline}
                    </p>
                    <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: '#6B7280' }}>
                      {event.ultra_short_summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
