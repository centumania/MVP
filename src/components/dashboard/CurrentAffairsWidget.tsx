'use client'

import { useState } from 'react'
import type { CurrentAffairsItem } from '@/src/app/api/current-affairs/route'

// ── Category styling ──────────────────────────────────────────────────────────

const CAT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  National:      { bg: 'rgba(37,51,255,0.10)',  color: '#4F6BFF', border: 'rgba(37,51,255,0.25)' },
  International: { bg: 'rgba(139,92,246,0.10)', color: '#A855F7', border: 'rgba(139,92,246,0.25)' },
  Economy:       { bg: 'rgba(16,185,129,0.10)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  Environment:   { bg: 'rgba(34,197,94,0.10)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)' },
  Science:       { bg: 'rgba(79,142,247,0.10)', color: '#4F8EF7', border: 'rgba(79,142,247,0.25)' },
  Sports:        { bg: 'rgba(251,191,36,0.10)', color: '#F59E0B', border: 'rgba(251,191,36,0.25)' },
  Awards:        { bg: 'rgba(246,179,0,0.10)',  color: '#F6B300', border: 'rgba(246,179,0,0.25)' },
  State:         { bg: 'rgba(20,184,166,0.10)', color: '#0EA5A0', border: 'rgba(20,184,166,0.25)' },
}

const RELEVANCE_STYLES: Record<string, { color: string; label: string }> = {
  High:   { color: '#EF4444', label: '🔥 High' },
  Medium: { color: '#F59E0B', label: '⚡ Medium' },
  Low:    { color: '#9CA3AF', label: '📌 Low' },
}

function defaultCatStyle() {
  return { bg: 'rgba(156,163,175,0.10)', color: '#9CA3AF', border: 'rgba(156,163,175,0.25)' }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  items:          CurrentAffairsItem[]
  generatedToday: boolean
  todayDate:      string
}

export function CurrentAffairsWidget({ items, generatedToday, todayDate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll,  setShowAll]  = useState(false)

  const displayed = showAll ? items : items.slice(0, 4)

  if (items.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '20px 18px',
      }}>
        <WidgetHeader generatedToday={generatedToday} date={todayDate} />
        <p style={{ color: 'var(--cm-neutral-300)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
          Today's current affairs are being generated… check back at 7 AM IST.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 16px',
    }}>
      <WidgetHeader generatedToday={generatedToday} date={todayDate} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {displayed.map(item => {
          const catStyle  = CAT_STYLES[item.category] ?? defaultCatStyle()
          const relStyle  = RELEVANCE_STYLES[item.exam_relevance] ?? RELEVANCE_STYLES.Medium
          const isOpen    = expanded === item.id

          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isOpen ? catStyle.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
              }}
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 12px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: '2px 7px',
                      borderRadius: 5, background: catStyle.bg, color: catStyle.color,
                      border: `1px solid ${catStyle.border}`,
                    }}>{item.category.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: relStyle.color }}>{relStyle.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', lineHeight: 1.4 }}>
                    {item.title}
                  </span>
                </div>
                <span style={{ color: 'var(--cm-neutral-300)', fontSize: 12, flexShrink: 0, paddingTop: 2 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded summary */}
              {isOpen && (
                <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{
                    fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, marginTop: 10,
                  }}>
                    {item.summary}
                  </p>
                  {item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--cm-neutral-300)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {items.length > 4 && (
        <button
          onClick={() => setShowAll(s => !s)}
          style={{
            width: '100%', marginTop: 10, padding: '8px',
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'var(--cm-neutral-300)', fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          {showAll ? 'Show less ▲' : `Show ${items.length - 4} more ▼`}
        </button>
      )}
    </div>
  )
}

function WidgetHeader({ generatedToday, date }: { generatedToday: boolean; date: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📰</span>
          <span style={{
            fontFamily: 'var(--font-bebas)', fontSize: 16, color: '#fff', letterSpacing: 0.5,
          }}>Current Affairs</span>
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(14,165,160,0.15)', color: '#0EA5A0',
            border: '1px solid rgba(14,165,160,0.3)', fontWeight: 700, letterSpacing: 0.5,
          }}>AI</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--cm-neutral-300)', marginTop: 2 }}>
          {generatedToday ? `Updated today · ${date}` : `Most recent available`}
        </div>
      </div>
    </div>
  )
}
