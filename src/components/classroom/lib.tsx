'use client'

// Shared classroom client helpers: auth/session + the two metric layers
// (Centum Index /api/study/interaction + engagement /api/events).
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { getSessionId, setCachedToken, trackEvent, trackBeacon } from '@/src/lib/analytics/track'
import { completionKey } from '@/src/data/classroom'

export const CT = {
  INK: '#1A1A2E', INK_SOFT: '#111827', PAPER: '#FFFFFF', HAIRLINE: '#E7E5E0',
  MUTED: '#6B7280', FAINT: '#9CA3AF', GREEN: '#16A34A', AMBER: '#B45309', SKY: '#0284c7',
}

type SessionState = { ready: boolean; userName: string; token: string }

export function useClassroomSession(): SessionState {
  const router = useRouter()
  const [s, setS] = useState<SessionState>({ ready: false, userName: 'Student', token: '' })
  useEffect(() => {
    let cancelled = false
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (!session) { router.replace('/auth/login'); return }
      setCachedToken(session.access_token)
      const name = (session.user.user_metadata?.name as string) ?? session.user.email?.split('@')[0] ?? 'Student'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setS({ ready: true, userName: name, token: session.access_token })
    })
    return () => { cancelled = true }
  }, [router])
  return s
}

// Centum Index layer — POST /api/study/interaction (Bearer auth).
export async function postInteraction(
  token: string,
  interaction_type: 'node_opened' | 'node_completed' | 'mcq_attempt',
  material_id: string,
  node_id: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await fetch('/api/study/interaction', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        interaction_type, node_id, material_id,
        session_id: getSessionId(), timestamp: new Date().toISOString(), metadata,
      }),
    })
  } catch { /* silent */ }
}

// Fire on lesson open: engagement + Centum node_opened.
export function trackLessonOpen(token: string, topicId: string): void {
  trackEvent('material_opened', { material_id: topicId, surface: 'classroom' })
  void postInteraction(token, 'node_opened', topicId, 'lesson')
}

// Fire on mark-complete: engagement + Centum node_completed.
export function trackLessonComplete(token: string, topicId: string, timeSpentMs: number): void {
  trackEvent('node_completed', { material_id: topicId, surface: 'classroom', time_spent_ms: timeSpentMs })
  void postInteraction(token, 'node_completed', topicId, 'lesson', { time_spent_ms: timeSpentMs })
}

// Fire on unload if the student spent a meaningful amount of time.
export function beaconLessonDwell(topicId: string, timeSpentMs: number): void {
  if (timeSpentMs >= 30_000) trackBeacon('daily_material_completed', { material_id: topicId, duration_ms: timeSpentMs, surface: 'classroom' })
}

// ── Instant completion ticks (localStorage) — backend also gets node_completed ──
export function isDone(topicId: string): boolean {
  try { return localStorage.getItem(completionKey(topicId)) === '1' } catch { return false }
}
export function setDone(topicId: string, done: boolean): void {
  try {
    if (done) localStorage.setItem(completionKey(topicId), '1')
    else localStorage.removeItem(completionKey(topicId))
  } catch { /* ignore */ }
}
