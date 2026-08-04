'use client'

/**
 * Embedded "ask about this lesson" box — strictly scoped to one module's own
 * written notes (see /api/ai/module-chat). Sits inline under the lesson
 * explanation, not floating, so it's clearly tied to what the student is
 * reading right now rather than a general-purpose assistant.
 */
import { useRef, useState } from 'react'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

export function ModuleAssistant({ moduleId, token }: { moduleId: string; token: string | null }) {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    const question = text.trim()
    if (!question || thinking || !token) return

    setNotice(null)
    setDraft('')
    const history = turns.slice(-8)
    setTurns(t => [...t, { role: 'user', content: question }])
    setThinking(true)

    try {
      const res = await fetch('/api/ai/module-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ moduleId, message: question, history }),
      })

      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => null)
        setNotice(info?.message ?? info?.error ?? 'Could not reach the assistant.')
        setThinking(false)
        return
      }

      setTurns(t => [...t, { role: 'assistant', content: '' }])
      setThinking(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setTurns(t => {
          const next = [...t]
          next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + chunk }
          return next
        })
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }
    } catch {
      setNotice('Network problem — please try again.')
      setThinking(false)
    }
  }

  if (!token) return null

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <SparkIcon />
          </span>
          <span>
            <span className="block text-[13.5px] font-bold text-gray-900">Ask about this lesson</span>
            <span className="block text-[11px] text-gray-500">Answers only from this lesson&apos;s own notes — no guessing</span>
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-indigo-100 bg-white">
          <div ref={scrollRef} className="max-h-[340px] space-y-2.5 overflow-y-auto px-4 py-3.5">
            {turns.length === 0 && (
              <p className="text-[12.5px] leading-relaxed text-gray-500">
                Ask a question about this specific lesson — it&apos;ll answer from the notes above, or tell you plainly if something isn&apos;t covered here.
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  t.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-800 ring-1 ring-gray-100'
                }`}>
                  {t.content || '…'}
                </div>
              </div>
            ))}
            {thinking && <p className="text-[12px] text-gray-500 animate-pulse">thinking…</p>}
            {notice && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800 ring-1 ring-amber-200/70">
                {notice}
              </p>
            )}
          </div>
          <form onSubmit={e => { e.preventDefault(); send(draft) }} className="flex items-center gap-2 border-t border-gray-100 px-3 py-2.5">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Ask about this lesson…"
              aria-label="Your question about this lesson"
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-indigo-300 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function SparkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.8L20 9.7l-5.1 3.1L16 19l-4-3.2L8 19l1.1-6.2L4 9.7l6.1-1.9z" />
    </svg>
  )
}
