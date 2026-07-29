'use client'

/**
 * Floating study companion.
 *
 * Collapsed it is a single button in the corner; expanded it is a chat panel.
 * It streams the reply token-by-token so the student sees the answer forming
 * rather than watching a spinner — an explanation can take several seconds.
 *
 * Hidden while signed out, and hidden inside the native app shell alongside
 * every other paid surface (see lib/native/app-mode).
 */
import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { useIsNativeApp } from '@/src/lib/native/app-mode'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Explain the Doctrine of Lapse',
  'Shortcut for percentage problems',
  "Today's current affairs in 5 points",
]

export function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const native = useIsNativeApp()

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null)
    })
  }, [])

  // Keep the newest message in view as it streams in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, thinking])

  async function send(text: string) {
    const question = text.trim()
    if (!question || thinking || !token) return

    setNotice(null)
    setDraft('')
    const history = turns.slice(-12)
    setTurns(t => [...t, { role: 'user', content: question }])
    setThinking(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: question, history }),
      })

      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => null)
        setNotice(info?.message ?? info?.error ?? 'Could not reach the study companion.')
        setThinking(false)
        return
      }

      // Open the assistant turn, then append each chunk as it arrives.
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
          next[next.length - 1] = {
            role: 'assistant',
            content: next[next.length - 1].content + chunk,
          }
          return next
        })
      }
    } catch {
      setNotice('Network problem — please try again.')
      setThinking(false)
    }
  }

  // Signed out, or inside the native app: render nothing at all.
  if (!token || native) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the AI study companion"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(79,70,229,0.6)] transition-transform hover:-translate-y-0.5 md:bottom-6"
      >
        <SparkIcon />
        Ask AI
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="AI study companion"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_-15px_rgba(16,24,40,0.35)] sm:inset-x-auto sm:right-6 sm:w-[380px] md:bottom-6"
    >
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <SparkIcon />
          </span>
          <div>
            <p className="text-[13.5px] font-bold leading-none text-gray-900">AI Assistant</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Ask anything about your syllabus</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the study companion"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="pt-2">
            <p className="text-[13.5px] leading-relaxed text-gray-600">
              You never have to study alone. Ask a question and get a clear answer straight away.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-[12px] font-medium text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                t.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-50 text-gray-800 ring-1 ring-gray-100'
              }`}
            >
              {t.content || '…'}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2 text-[12.5px] text-gray-500">
            <SparkIcon />
            <span className="animate-pulse">thinking…</span>
          </div>
        )}

        {notice && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-800 ring-1 ring-amber-200/70">
            {notice}
          </p>
        )}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); send(draft) }}
        className="flex items-center gap-2 border-t border-gray-100 px-3 py-3"
      >
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="What do you have in mind?"
          aria-label="Your question"
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!draft.trim() || thinking}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  )
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.8L20 9.7l-5.1 3.1L16 19l-4-3.2L8 19l1.1-6.2L4 9.7l6.1-1.9z" />
    </svg>
  )
}
