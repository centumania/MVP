'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import Link from 'next/link'
import { EventCard } from '@/src/components/current-affairs/EventCard'
import { LanguageToggle } from '@/src/components/current-affairs/LanguageToggle'
import type { Lang } from '@/src/components/current-affairs/LanguageToggle'
import type { CAIEEvent, CAIEEventListResponse, ExamType } from '@/src/lib/caie/types'

const EXAM_TYPES: ExamType[] = ['UPSC', 'TNPSC', 'SSC', 'Banking', 'Railways', 'State_PSC']

const CATEGORIES = [
  'Polity & Governance', 'Economy & Finance', 'Science & Technology',
  'Environment & Ecology', 'History & Culture', 'Geography',
  'International Relations', 'Defence & Security', 'Sports',
  'Awards & Recognitions', 'Appointments', 'Reports & Indices',
  'Schemes & Policies', 'Bills & Acts', 'Summits & Conferences',
  'Organisations', 'Agriculture', 'Health & Medicine',
  'Education', 'Miscellaneous',
]

export default function CurrentAffairsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('Student')
  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<CAIEEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unpaid'>('loading')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [examType, setExamType] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [importance, setImportance] = useState<string>('')
  const [lang, setLang] = useState<Lang>('en')

  const fetchEvents = useCallback(async (tok: string, pg: number, append = false) => {
    try {
      const sp = new URLSearchParams({ page: String(pg), per_page: '20' })
      if (examType)  sp.set('exam_type', examType)
      if (category)  sp.set('category', category)
      if (importance) sp.set('importance', importance)
      if (lang !== 'en') sp.set('lang', lang)

      const res = await fetch(`/api/caie/events?${sp}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.status === 403) { setState('unpaid'); return }
      if (!res.ok) { setState('error'); return }
      const data: CAIEEventListResponse = await res.json()
      setEvents(prev => append ? [...prev, ...data.data] : data.data)
      setTotal(data.total)
      setHasMore(data.has_more)
      setState('ready')
    } catch { setState('error') }
  }, [examType, category, importance, lang])

  const runSearch = useCallback(async (tok: string) => {
    if (!searchQuery.trim()) { fetchEvents(tok, 1); return }
    try {
      setState('loading')
      const res = await fetch('/api/caie/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, exam_type: examType || undefined }),
      })
      if (res.status === 403) { setState('unpaid'); return }
      if (!res.ok) { setState('error'); return }
      const data = await res.json()
      setEvents(data.data ?? [])
      setTotal(data.total ?? 0)
      setHasMore(false)
      setState('ready')
    } catch { setState('error') }
  }, [searchQuery, examType, fetchEvents])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)
      setToken(session.access_token)
      fetchEvents(session.access_token, 1)
    })
  }, [router, fetchEvents])

  // Reset the displayed page to 1 whenever filters/search change — adjusted
  // during render (not an effect): it's pure derived UI state, no side effect.
  const filterKey = `${examType}|${category}|${importance}|${searchQuery}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  useEffect(() => {
    if (!token) return
    // Deferred via microtask: both functions set state synchronously as their
    // first statement, so calling them directly here would cascade renders.
    void Promise.resolve().then(() => {
      if (searchQuery) runSearch(token)
      else fetchEvents(token, 1)
    })
  }, [examType, category, importance, token, searchQuery, runSearch, fetchEvents])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(search)
  }

  function loadMore() {
    if (!token || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchEvents(token, next, true)
  }

  function clearSearch() {
    setSearch('')
    setSearchQuery('')
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#111827' }}>
              Current Affairs
            </h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              AI-verified events from 25+ trusted sources
            </p>
            <div className="flex items-center gap-4 mt-1">
              <Link
                href="/current-affairs/progress"
                className="text-[11px] font-semibold inline-flex items-center gap-1"
                style={{ color: '#0284c7' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 20V10M12 20V4M6 20v-6"/>
                </svg>
                My Progress
              </Link>
              <Link
                href="/current-affairs/entities"
                className="text-[11px] font-semibold inline-flex items-center gap-1"
                style={{ color: '#0284c7' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/>
                  <path d="M7.3 10.9 16.7 7.1M7.3 13.1l9.4 3.8"/>
                </svg>
                Knowledge Explorer
              </Link>
            </div>
          </div>
          <LanguageToggle value={lang} onChange={(l) => { setLang(l); setPage(1) }} />
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                color: '#111827',
              }}
            />
            <button
              type="submit"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ background: '#0284c7', color: '#fff' }}
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-xl px-3 py-2.5 text-sm"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <select
            value={examType}
            onChange={e => setExamType(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs shrink-0 outline-none"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: examType ? '#111827' : '#9CA3AF',
            }}
          >
            <option value="">All Exams</option>
            {EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs shrink-0 outline-none"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: category ? '#111827' : '#9CA3AF',
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={importance}
            onChange={e => setImportance(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs shrink-0 outline-none"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: importance ? '#111827' : '#9CA3AF',
            }}
          >
            <option value="">All Importance</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* States */}
        {state === 'loading' && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl h-32 animate-pulse"
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
              Current Affairs is available for enrolled students. Contact support to activate.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#EF4444' }}>
              Failed to load
            </p>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              The service may be temporarily unavailable.
            </p>
            <button
              onClick={() => token && fetchEvents(token, 1)}
              className="text-sm font-semibold"
              style={{ color: '#0284c7' }}
            >
              Retry
            </button>
          </div>
        )}

        {state === 'ready' && events.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              No events found. Try adjusting your filters.
            </p>
          </div>
        )}

        {state === 'ready' && events.length > 0 && (
          <>
            <p className="text-xs mb-3" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {searchQuery ? `Search results` : `${total} events`}
            </p>
            <div className="space-y-3">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full mt-6 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: 'rgba(0,0,0,0.65)',
                }}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
