'use client'

/**
 * /mentor/:examId
 *
 * Displays the AI Mentor Report for a specific exam submission.
 * Polls every 3 seconds if the report is not ready yet (fire-and-forget
 * generation on the backend takes ~2-4 seconds).
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import type { AiReport } from '@/src/types/database'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readinessColor(score: number) {
  if (score >= 80) return '#6fcf8f'
  if (score >= 60) return '#5ec8c0'
  if (score >= 40) return '#e7b14c'
  return '#e8736b'
}

function readinessLabel(score: number) {
  if (score >= 80) return 'Exam Ready'
  if (score >= 60) return 'On Track'
  if (score >= 40) return 'Needs Focus'
  return 'Build Foundation'
}

// SVG ring progress indicator
function ReadinessRing({ score }: { score: number }) {
  const r      = 44
  const circ   = 2 * Math.PI * r
  const fill   = (score / 100) * circ
  const col    = readinessColor(score)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width={120} height={120} viewBox="0 0 120 120" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={col} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${col}60)`, transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-bold font-mono leading-none" style={{ color: col }}>{score}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest font-mono mt-0.5" style={{ color: col }}>
          {readinessLabel(score)}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'loading' | 'generating' | 'ready' | 'error'

export default function MentorReportPage() {
  const { examId } = useParams() as { examId: string }
  const router     = useRouter()

  const [phase, setPhase]   = useState<Phase>('loading')
  const [report, setReport] = useState<AiReport | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [token, setToken]   = useState<string | null>(null)
  const [polls, setPolls]   = useState(0)

  const fetchReport = useCallback(async (tok: string) => {
    const res = await fetch(`/api/mentor/report/${examId}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })

    if (res.status === 401) { router.replace('/auth/login'); return }

    if (res.status === 404) {
      // Report still generating — keep polling (up to ~15 s)
      setPhase('generating')
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setErrMsg(body?.error ?? 'Failed to load report.')
      setPhase('error')
      return
    }

    const { report: data } = await res.json()
    setReport(data)
    setPhase('ready')
  }, [examId, router])

  // On mount: get auth token
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
    })
  }, [router])

  // First fetch once token is available
  useEffect(() => {
    if (token && phase === 'loading') {
      fetchReport(token)
    }
  }, [token, phase, fetchReport])

  // Poll while generating (every 3 s, max 5 retries ≈ 15 s)
  useEffect(() => {
    if (phase !== 'generating' || !token || polls >= 5) {
      if (phase === 'generating' && polls >= 5) {
        setErrMsg('Report is taking longer than expected. Please refresh the page.')
        setPhase('error')
      }
      return
    }
    const id = setTimeout(() => {
      setPolls(p => p + 1)
      fetchReport(token)
    }, 3000)
    return () => clearTimeout(id)
  }, [phase, token, polls, fetchReport])

  // ── Loading / Generating ─────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0e1410' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#6fcf8f', boxShadow: '0 0 12px rgba(111,207,143,0.3)' }} />
        <p className="text-sm text-text-muted">
          {phase === 'generating' ? 'Your mentor report is being generated…' : 'Loading report…'}
        </p>
        {phase === 'generating' && (
          <p className="text-[11px] text-text-muted" style={{ opacity: 0.5 }}>This usually takes 2–4 seconds</p>
        )}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0e1410' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8736b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>Report unavailable</h2>
        <p className="text-sm text-text-muted max-w-xs mb-6">{errMsg}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #27342b', color: '#9aa893' }}>
          Go back
        </button>
      </div>
    )
  }

  if (!report) return null

  const col = readinessColor(report.readiness_score)

  // ── Report ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0e1410' }}>

      {/* Header */}
      <header className="sticky top-0 z-20"
        style={{ background: 'rgba(14,20,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #27342b' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg transition-colors"
            style={{ color: '#6b7a63' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8ead8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7a63'; (e.currentTarget as HTMLButtonElement).style.background = '' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold text-text tracking-tight">Mentor Report</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
              CentuMania AI Coach
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* ── Metrics row ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: '#16201a', border: '1px solid #27342b' }}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Readiness ring */}
            <div className="flex flex-col items-center gap-2">
              <ReadinessRing score={report.readiness_score} />
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted font-mono">Readiness</p>
            </div>

            {/* Right stats */}
            <div className="flex-1 w-full space-y-3">
              {/* Predicted range */}
              <div className="rounded-xl px-4 py-3" style={{ background: '#1b271f', border: '1px solid #27342b' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted font-mono mb-1">Predicted Score Range</p>
                <p className="text-xl font-bold font-mono" style={{ color: col }}>
                  {report.predicted_low}–{report.predicted_high}
                  <span className="text-sm text-text-muted font-normal ml-1">/ 100</span>
                </p>
              </div>

              {/* Learning profile */}
              <div className="rounded-xl px-4 py-3" style={{ background: '#1b271f', border: '1px solid #27342b' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted font-mono mb-1">Learning Profile</p>
                <p className="text-sm font-bold text-text">{report.learning_profile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Strengths ───────────────────────────────────────────── */}
        {report.strengths_text && (
          <ReportSection
            icon={<StrengthIcon />}
            accent="rgba(111,207,143,0.12)"
            accentBorder="rgba(111,207,143,0.20)"
            label="Strengths"
            text={report.strengths_text}
          />
        )}

        {/* ── Weaknesses ──────────────────────────────────────────── */}
        {report.weaknesses_text && (
          <ReportSection
            icon={<WeaknessIcon />}
            accent="rgba(232,115,107,0.08)"
            accentBorder="rgba(232,115,107,0.18)"
            label="Weaknesses & Gaps"
            text={report.weaknesses_text}
          />
        )}

        {/* ── Recommendations ─────────────────────────────────────── */}
        {report.recommendations_text && (
          <ReportSection
            icon={<RecommendIcon />}
            accent="rgba(94,200,192,0.08)"
            accentBorder="rgba(94,200,192,0.18)"
            label="Today's Mission"
            text={report.recommendations_text}
          />
        )}

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="pt-2 pb-8">
          <p className="text-[10px] text-text-muted text-center font-mono" style={{ opacity: 0.4 }}>
            Generated by CentuMania Mentor · {new Date(report.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportSection({
  icon, accent, accentBorder, label, text,
}: {
  icon:         React.ReactNode
  accent:       string
  accentBorder: string
  label:        string
  text:         string
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#16201a', border: '1px solid #27342b' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accent, border: `1px solid ${accentBorder}` }}>
          {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono">{label}</p>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

function StrengthIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fcf8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function WeaknessIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8736b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}

function RecommendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5ec8c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
