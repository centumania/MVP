'use client'

/**
 * Dashboard v2 — Current Affairs panel.
 * Same props contract as v1 CurrentAffairsWidget; light design system,
 * accessible accordion, animated expansion.
 */
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from '@/src/components/landing-v2/icons'
import { Card, CardLabel } from './ui'
import type { CurrentAffairsItem } from '@/src/app/api/current-affairs/route'

const CAT_STYLES: Record<string, string> = {
  National: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  International: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  Economy: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  Environment: 'bg-green-50 text-green-700 ring-green-200/70',
  Science: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
  Sports: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  Awards: 'bg-yellow-50 text-yellow-700 ring-yellow-200/70',
  State: 'bg-teal-50 text-teal-700 ring-teal-200/70',
}
const DEFAULT_CAT = 'bg-gray-50 text-gray-600 ring-gray-200/70'

const RELEVANCE: Record<string, { cls: string; label: string }> = {
  High: { cls: 'text-red-600', label: 'High relevance' },
  Medium: { cls: 'text-amber-600', label: 'Medium' },
  Low: { cls: 'text-gray-400', label: 'Low' },
}

function Header({ generatedToday, date }: { generatedToday: boolean; date: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <CardLabel>Current Affairs</CardLabel>
          <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-teal-700 ring-1 ring-teal-200/70">AI</span>
        </div>
        <p className="mt-1 text-[11.5px] text-gray-400">{generatedToday ? `Updated today · ${date}` : 'Most recent available'}</p>
      </div>
      <Link href="/current-affairs" className="text-[12px] font-bold text-sky-600 transition-colors hover:text-sky-700">
        View all →
      </Link>
    </div>
  )
}

export function NewsPanel({ items, generatedToday, todayDate }: {
  items: CurrentAffairsItem[]
  generatedToday: boolean
  todayDate: string
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? items : items.slice(0, 4)

  if (items.length === 0) {
    return (
      <Card>
        <Header generatedToday={generatedToday} date={todayDate} />
        <p className="mt-4 text-center text-[13px] text-gray-500">
          Today&apos;s current affairs are being generated… check back at 7 AM IST.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <Header generatedToday={generatedToday} date={todayDate} />

      <div className="mt-4 space-y-2">
        {displayed.map(item => {
          const cat = CAT_STYLES[item.category] ?? DEFAULT_CAT
          const rel = RELEVANCE[item.exam_relevance] ?? RELEVANCE.Medium
          const isOpen = expanded === item.id
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border transition-colors ${isOpen ? 'border-sky-200/80 bg-sky-50/30' : 'border-gray-200/70 bg-white'}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-gray-50/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${cat}`}>
                      {item.category}
                    </span>
                    <span className={`text-[10.5px] font-semibold ${rel.cls}`}>{rel.label}</span>
                  </span>
                  <span className="block text-[13.5px] font-semibold leading-snug text-gray-900">{item.title}</span>
                </span>
                <ChevronDown size={15} className={`mt-1 shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-600' : ''}`} />
              </button>
              <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                <div className="overflow-hidden">
                  <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-3">
                    <p className="text-[13px] leading-relaxed text-gray-600">{item.summary}</p>
                    {item.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {item.tags.map(tag => (
                          <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll(s => !s)}
          className="mt-3 w-full rounded-xl border border-gray-200/80 py-2 text-[12.5px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
        >
          {showAll ? 'Show less' : `Show ${items.length - 4} more`}
        </button>
      )}
    </Card>
  )
}
