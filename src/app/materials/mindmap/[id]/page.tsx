'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

/**
 * MindMap Viewer — /materials/mindmap/[id]
 *
 * Renders an interactive HTML MindMap in a sandboxed iframe.
 * Fetches HTML via /api/materials/mindmap/[id] (auth-gated, proxied).
 *
 * Extension points (stubbed, not yet active):
 *   - onMindMapLoad(): hook for future XP grant on open
 *   - onMindMapComplete(): hook for future completion tracking
 *   - trackNodeVisit(nodeId): hook for learning analytics
 *   - saveProgress(state): hook for progress persistence
 * These are exported as no-ops so future modules can replace them
 * without modifying this file.
 */

// ── Extension point stubs ──────────────────────────────────────────
// Replace these with real implementations in future phases.
export function onMindMapLoad(materialId: string): void { void materialId /* future: grant XP */ }
export function onMindMapComplete(materialId: string): void { void materialId /* future: completion badge */ }
export function trackNodeVisit(nodeId: string): void { void nodeId /* future: learning analytics */ }
export function saveProgress(state: unknown): void { void state /* future: progress persistence */ }

type LoadState = 'loading' | 'ready' | 'error' | 'expired' | 'unauthorized'

export default function MindMapViewer() {
  const { id }   = useParams() as { id: string }
  const router   = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [state, setState]     = useState<LoadState>('loading')
  const [htmlSrc, setHtmlSrc] = useState<string>('')
  const [title, setTitle]     = useState<string>('Study Map')

  useEffect(() => {
    let objectUrl: string | null = null

    async function load() {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const res = await fetch(`/api/materials/mindmap/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { setState('unauthorized'); return }
      if (res.status === 404) { setState('expired'); return }
      if (!res.ok)             { setState('error'); return }

      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      objectUrl  = URL.createObjectURL(blob)
      setHtmlSrc(objectUrl)
      setState('ready')

      // Extension point: fired on load
      onMindMapLoad(id)
    }

    load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id, router])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0e1410' }}
    >
      {/* ── Header bar ─────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 h-12 shrink-0"
        style={{ background: '#0e1410', borderBottom: '1px solid #27342b' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/materials"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors font-mono"
            aria-label="Back to materials"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Materials
          </Link>
          <span className="text-text-muted text-xs" aria-hidden="true">·</span>
          <span className="text-xs font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {state === 'ready' && (
            <span
              className="text-[10px] font-mono text-primary px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(111,207,143,0.10)', border: '1px solid rgba(111,207,143,0.20)' }}
            >
              Interactive Map
            </span>
          )}
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 relative">

        {/* Loading state */}
        {state === 'loading' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: '#0e1410' }}
            aria-live="polite"
            aria-label="Loading study map"
          >
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: '2px solid rgba(111,207,143,0.2)', borderTopColor: '#6fcf8f' }}
            />
            <p className="text-sm text-text-muted font-mono">Loading study map&hellip;</p>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
            style={{ background: '#0e1410' }}
            role="alert"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#e8736b" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-text">Failed to load</p>
            <p className="text-xs text-text-muted">The study map could not be retrieved. Please try again.</p>
            <button
              onClick={() => setState('loading')}
              className="text-xs text-primary hover:text-primary-hover underline font-mono transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Expired state */}
        {state === 'expired' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
            style={{ background: '#0e1410' }}
            role="alert"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(231,177,76,0.10)', border: '1px solid rgba(231,177,76,0.20)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#e7b14c" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-text">Content expired</p>
            <p className="text-xs text-text-muted max-w-xs">This study map is no longer available. Materials are published fresh each day.</p>
            <Link href="/materials" className="text-xs text-primary hover:text-primary-hover underline font-mono transition-colors">
              Back to Materials
            </Link>
          </div>
        )}

        {/* Unauthorized */}
        {state === 'unauthorized' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
            style={{ background: '#0e1410' }}
            role="alert"
          >
            <p className="text-sm text-text-secondary">Payment verification required to access study materials.</p>
            <Link href="/dashboard" className="text-xs text-primary hover:text-primary-hover underline font-mono transition-colors">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* MindMap iframe — sandboxed for security */}
        {state === 'ready' && htmlSrc && (
          <iframe
            ref={iframeRef}
            src={htmlSrc}
            title={title}
            className="w-full h-full absolute inset-0 border-0"
            style={{ minHeight: 'calc(100vh - 48px)' }}
            // Sandbox: allow scripts (needed for interactive maps) but block
            // top-level navigation, form submission, and popups.
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => {
              // Try to read the title from the iframe document
              try {
                const doc = iframeRef.current?.contentDocument
                if (doc?.title) setTitle(doc.title)
              } catch { /* cross-origin — ignore */ }
            }}
            aria-label={`Interactive study map: ${title}`}
          />
        )}
      </main>
    </div>
  )
}
