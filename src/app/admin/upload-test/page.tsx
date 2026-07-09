'use client'

/**
 * /admin/upload-test — paste JSON questions, preview, publish a daily test.
 * Published tests take priority over AI-generated assignments for that date.
 */

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type UploadedQuestion = {
  question:    string
  options:     string[]
  correct:     number
  explanation?: string | null
  topic?:      string
}

type TestRow = {
  id:             string
  test_date:      string
  title:          string
  question_count: number
  is_published:   boolean
  created_at:     string
}

const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }
const inputStyle: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827',
  height: 44, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%',
}

const SAMPLE = `[
  {
    "question": "Who is known as the Father of the Indian Constitution?",
    "options": ["Jawaharlal Nehru", "B.R. Ambedkar", "Mahatma Gandhi", "Sardar Patel"],
    "correct": 1,
    "explanation": "Dr. B.R. Ambedkar chaired the drafting committee.",
    "topic": "Indian Polity"
  }
]`

function todayISO(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
}

function parseUploadedQuestions(rawJson: string): { parsed: UploadedQuestion[] | null; parseErr: string | null } {
  if (!rawJson.trim()) return { parsed: null, parseErr: null }
  try {
    const arr = JSON.parse(rawJson)
    if (!Array.isArray(arr)) return { parsed: null, parseErr: 'JSON must be an array of questions' }
    for (let i = 0; i < arr.length; i++) {
      const q = arr[i]
      if (typeof q?.question !== 'string' || !q.question.trim())
        return { parsed: null, parseErr: `Q${i + 1}: missing "question"` }
      if (!Array.isArray(q.options) || q.options.length !== 4)
        return { parsed: null, parseErr: `Q${i + 1}: "options" must have exactly 4 entries` }
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3)
        return { parsed: null, parseErr: `Q${i + 1}: "correct" must be 0-3` }
    }
    return { parsed: arr, parseErr: null }
  } catch (e) {
    return { parsed: null, parseErr: e instanceof Error ? e.message : 'Invalid JSON' }
  }
}

export default function UploadTestPage() {
  const [token,    setToken]    = useState<string | null>(null)
  const [tests,    setTests]    = useState<TestRow[]>([])
  const [testDate, setTestDate] = useState(todayISO())
  const [title,    setTitle]    = useState('Daily Test')
  const [rawJson,  setRawJson]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [message,  setMessage]  = useState<{ ok: boolean; text: string } | null>(null)

  const loadTests = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/upload-test', {
      headers: { Authorization: `Bearer ${tok}` }, cache: 'no-store',
    })
    if (res.ok) {
      const body = await res.json()
      setTests(body.tests ?? [])
    }
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token)
        loadTests(session.access_token)
      }
    })
  }, [loadTests])

  // Live parse + client-side validation for the preview — pure function of
  // rawJson, cheap enough (≤200 questions) to compute directly on render.
  const { parsed, parseErr } = parseUploadedQuestions(rawJson)

  async function handlePublish() {
    if (!token || !parsed) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testDate, title, questions: parsed }),
      })
      const body = await res.json()
      if (res.ok) {
        setMessage({ ok: true, text: `Published ${body.test.question_count} questions for ${body.test.test_date}` })
        setRawJson('')
        loadTests(token)
      } else {
        setMessage({ ok: false, text: body.error ?? 'Failed to publish' })
      }
    } catch {
      setMessage({ ok: false, text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    if (!confirm('Delete this uploaded test? Students will fall back to the AI-generated test for that day.')) return
    const res = await fetch(`/api/admin/upload-test?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) loadTests(token)
  }

  const topicCounts: Record<string, number> = {}
  for (const q of parsed ?? []) {
    const t = q.topic?.trim() || 'General Studies'
    topicCounts[t] = (topicCounts[t] ?? 0) + 1
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: '#111827' }}>Upload Daily Test</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Paste questions as JSON. Everyone gets the same set on the chosen date — it overrides the AI-generated test.
        </p>
      </div>

      {/* ── Upload form ────────────────────────────────────────────── */}
      <div className="p-4 md:p-5 space-y-4" style={CARD}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>Test date</label>
            <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Daily Test" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium" style={{ color: '#374151' }}>Questions JSON</label>
            <button type="button" onClick={() => { setRawJson(SAMPLE); setMessage(null) }}
              className="text-xs font-medium hover:underline" style={{ color: '#0284c7' }}>
              Load sample format
            </button>
          </div>
          <textarea
            value={rawJson}
            onChange={e => { setRawJson(e.target.value); setMessage(null) }}
            rows={12}
            spellCheck={false}
            placeholder={'Paste your JSON array here…\n\n' + SAMPLE}
            className="w-full font-mono text-xs rounded-lg p-3"
            style={{ background: '#F9FAFB', border: `1px solid ${parseErr ? '#EF4444' : '#E5E7EB'}`, color: '#111827', resize: 'vertical' }}
          />
          {parseErr && <p className="text-xs mt-1.5" style={{ color: '#DC2626' }}>⚠ {parseErr}</p>}
        </div>

        {/* Preview summary */}
        {parsed && (
          <div className="rounded-lg p-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>
              ✓ {parsed.length} question{parsed.length === 1 ? '' : 's'} ready
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(topicCounts).map(([t, c]) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}>
                  {t} · {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Question preview list */}
        {parsed && (
          <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg p-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            {parsed.map((q, i) => (
              <div key={i} className="text-xs pb-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <p className="font-medium" style={{ color: '#111827' }}>Q{i + 1}. {q.question}</p>
                <div className="mt-1 space-y-0.5">
                  {q.options.map((o, j) => (
                    <p key={j} style={{ color: j === q.correct ? '#16A34A' : '#6B7280', fontWeight: j === q.correct ? 600 : 400 }}>
                      {String.fromCharCode(65 + j)}. {o}{j === q.correct ? ' ✓' : ''}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className="text-sm font-medium" style={{ color: message.ok ? '#16A34A' : '#DC2626' }}>
            {message.ok ? '✓ ' : '⚠ '}{message.text}
          </p>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={!parsed || saving}
          className="h-11 px-6 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#0284c7', color: '#FFFFFF' }}
        >
          {saving ? 'Publishing…' : `Publish for ${testDate}`}
        </button>
      </div>

      {/* ── Existing uploads ───────────────────────────────────────── */}
      <div style={CARD}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Uploaded tests</h2>
        </div>
        {tests.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center" style={{ color: '#9CA3AF' }}>No uploaded tests yet.</p>
        ) : (
          <div>
            {tests.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(229,231,235,0.6)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{t.title}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.test_date} · {t.question_count} questions</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={t.is_published
                    ? { background: '#DCFCE7', color: '#166534' }
                    : { background: '#F3F4F6', color: '#6B7280' }}>
                  {t.is_published ? 'Live' : 'Draft'}
                </span>
                <button type="button" onClick={() => handleDelete(t.id)}
                  className="text-xs font-medium shrink-0 hover:underline" style={{ color: '#DC2626' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
