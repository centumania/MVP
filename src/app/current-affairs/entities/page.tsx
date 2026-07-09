'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import type { CAIEEntity, CAIEEntityListResponse, EntityType } from '@/src/lib/caie/types'

const TYPE_FILTERS: { value: EntityType | ''; label: string }[] = [
  { value: '',             label: 'All Types' },
  { value: 'person',       label: 'People' },
  { value: 'organization', label: 'Organisations' },
  { value: 'scheme',       label: 'Schemes' },
  { value: 'act',          label: 'Acts' },
  { value: 'bill',         label: 'Bills' },
  { value: 'committee',    label: 'Committees' },
  { value: 'report',       label: 'Reports' },
  { value: 'award',        label: 'Awards' },
  { value: 'court',        label: 'Courts' },
  { value: 'mission',      label: 'Missions' },
  { value: 'space_program',label: 'Space Programs' },
  { value: 'treaty',       label: 'Treaties' },
  { value: 'summit',       label: 'Summits' },
  { value: 'country',      label: 'Countries' },
  { value: 'state',        label: 'States' },
]

const TYPE_COLOR: Partial<Record<EntityType, string>> = {
  person:        '#F6B300',
  organization:  '#0284c7',
  scheme:        '#10B981',
  act:           '#EF4444',
  bill:          '#EF4444',
  committee:     '#0EA5A0',
  report:        '#A78BFA',
  award:         '#F59E0B',
  court:         '#F87171',
  mission:       '#38BDF8',
  space_program: '#38BDF8',
  treaty:        '#34D399',
  summit:        '#34D399',
  country:       '#FB923C',
  state:         '#FB923C',
  city:          '#FB923C',
}

function typeColor(t: EntityType): string {
  return TYPE_COLOR[t] ?? 'rgba(255,255,255,0.5)'
}

function typeLabel(t: EntityType): string {
  return t.replace(/_/g, ' ')
}

export default function EntitiesPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('Student')
  const [token, setToken]       = useState<string | null>(null)
  const [entities, setEntities] = useState<CAIEEntity[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(false)
  const [state, setState]       = useState<'loading' | 'ready' | 'error' | 'unpaid'>('loading')
  const [search, setSearch]         = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [type, setType]         = useState<string>('')

  const fetchEntities = useCallback(async (tok: string, pg: number, append = false) => {
    try {
      const sp = new URLSearchParams({ page: String(pg), per_page: '30' })
      if (searchQuery) sp.set('name', searchQuery)
      if (type)        sp.set('type', type)

      const res = await fetch(`/api/caie/entities?${sp}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.status === 403) { setState('unpaid'); return }
      if (!res.ok) { setState('error'); return }
      const data: CAIEEntityListResponse = await res.json()
      setEntities(prev => append ? [...prev, ...data.data] : data.data)
      setTotal(data.total)
      setHasMore(data.has_more)
      setState('ready')
    } catch { setState('error') }
  }, [searchQuery, type])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)
      setToken(session.access_token)
      fetchEntities(session.access_token, 1)
    })
  }, [router, fetchEntities])

  // Reset the displayed page to 1 whenever filters/search change — adjusted
  // during render (not an effect): it's pure derived UI state, no side effect.
  const filterKey = `${type}|${searchQuery}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  useEffect(() => {
    if (!token) return
    // Deferred via microtask: fetchEntities sets state synchronously as its
    // first statement, so calling it directly here would cascade renders.
    void Promise.resolve().then(() => fetchEntities(token, 1))
  }, [type, searchQuery, token, fetchEntities])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(search.trim())
  }

  function loadMore() {
    if (!token || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchEntities(token, next, true)
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <div className="mb-6">
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
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#111827' }}>
          Knowledge Explorer
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          People, schemes, acts, and organisations extracted from verified news
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entities..."
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
                onClick={() => { setSearch(''); setSearchQuery('') }}
                className="rounded-xl px-3 py-2.5 text-sm"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs shrink-0 outline-none"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: type ? '#111827' : '#9CA3AF',
            }}
          >
            {TYPE_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* States */}
        {state === 'loading' && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl h-14 animate-pulse"
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
              Knowledge Explorer is available for enrolled students.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#EF4444' }}>
              Failed to load
            </p>
            <button
              onClick={() => token && fetchEntities(token, 1)}
              className="text-sm font-semibold"
              style={{ color: '#0284c7' }}
            >
              Retry
            </button>
          </div>
        )}

        {state === 'ready' && entities.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              No entities found. Try a different search or type.
            </p>
          </div>
        )}

        {state === 'ready' && entities.length > 0 && (
          <>
            <p className="text-xs mb-3" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {total} entities
            </p>
            <div className="space-y-2">
              {entities.map(entity => (
                <Link
                  key={entity.id}
                  href={`/current-affairs/entities/${entity.id}`}
                  className="block group"
                >
                  <div
                    className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-150 group-hover:translate-y-[-1px]"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: '#111827' }}>
                        {entity.name}
                      </p>
                      {entity.description && (
                        <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>
                          {entity.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0 capitalize"
                      style={{
                        color: typeColor(entity.entity_type),
                        background: `${typeColor(entity.entity_type)}18`,
                      }}
                    >
                      {typeLabel(entity.entity_type)}
                    </span>
                  </div>
                </Link>
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
