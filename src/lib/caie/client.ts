/**
 * Server-side CAIE API client.
 * Calls the CAIE Supabase Edge Functions using the CAIE anon key.
 * CAIE's RLS ensures only published events are exposed.
 * Never call this from client components — use /api/caie/* proxy routes.
 */
import type {
  CAIEAttempt,
  CAIEAttemptListResponse,
  CAIEAttemptResult,
  CAIEEntityDetail,
  CAIEUserStats,
  CAIEEntityListResponse,
  CAIEEventDetail,
  CAIEEventListResponse,
  CAIEMCQListResponse,
  CAIERevisionResponse,
  CAIESearchResponse,
} from './types'

const CAIE_API_URL = process.env.CAIE_API_URL ?? ''
const CAIE_ANON_KEY = process.env.CAIE_ANON_KEY ?? ''

const FETCH_TIMEOUT_MS = 8000

function caieHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: CAIE_ANON_KEY,
    Authorization: `Bearer ${CAIE_ANON_KEY}`,
  }
}

async function caieGet<T>(path: string): Promise<T> {
  if (!CAIE_API_URL) throw new Error('CAIE_API_URL is not configured')
  const res = await fetch(`${CAIE_API_URL}${path}`, {
    headers: caieHeaders(),
    next: { revalidate: 300 }, // 5-min edge cache
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`CAIE API error: ${res.status} ${path}`)
  return res.json() as Promise<T>
}

async function caiePost<T>(path: string, body: unknown): Promise<T> {
  if (!CAIE_API_URL) throw new Error('CAIE_API_URL is not configured')
  const res = await fetch(`${CAIE_API_URL}${path}`, {
    method: 'POST',
    headers: caieHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`CAIE API error: ${res.status} ${path}`)
  return res.json() as Promise<T>
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getCAIEEvents(params: {
  category?: string
  exam_type?: string
  importance?: string
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
  lang?: string
} = {}): Promise<CAIEEventListResponse> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)))
  const query = qs.toString() ? `?${qs}` : ''
  return caieGet<CAIEEventListResponse>(`/events${query}`)
}

export async function getCAIEEvent(id: string, lang?: string): Promise<CAIEEventDetail> {
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : ''
  return caieGet<CAIEEventDetail>(`/events/${id}${qs}`)
}

export async function getCAIEMCQs(params: {
  event_id?: string
  exam_type?: string
  difficulty?: string
  page?: number
  per_page?: number
} = {}): Promise<CAIEMCQListResponse> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)))
  const query = qs.toString() ? `?${qs}` : ''
  return caieGet<CAIEMCQListResponse>(`/mcqs${query}`)
}

export async function searchCAIEEvents(body: {
  query: string
  exam_type?: string
  category?: string
  limit?: number
}): Promise<CAIESearchResponse> {
  return caiePost<CAIESearchResponse>('/search', body)
}

export async function getCAIEEntities(params: {
  name?: string
  type?: string
  page?: number
  per_page?: number
} = {}): Promise<CAIEEntityListResponse> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)))
  const query = qs.toString() ? `?${qs}` : ''
  return caieGet<CAIEEntityListResponse>(`/entities${query}`)
}

export async function getCAIEEntity(id: string): Promise<CAIEEntityDetail> {
  return caieGet<CAIEEntityDetail>(`/entities/${id}`)
}

export async function getCAIEAttempts(userId: string, mcqIds: string[]): Promise<CAIEAttempt[]> {
  if (mcqIds.length === 0) return []
  const qs = new URLSearchParams({ user_id: userId, mcq_ids: mcqIds.join(',') })
  const res = await caieGet<CAIEAttemptListResponse>(`/attempts?${qs}`)
  return res.data
}

export async function submitCAIEAttempt(body: {
  mcq_id: string
  user_id: string
  chosen_option: string
}): Promise<CAIEAttemptResult> {
  return caiePost<CAIEAttemptResult>('/attempts', body)
}

export async function getCAIEUserStats(userId: string): Promise<CAIEUserStats> {
  return caieGet<CAIEUserStats>(`/attempts/stats?user_id=${encodeURIComponent(userId)}`)
}

export async function getCAIERevisionMCQs(userId: string): Promise<CAIERevisionResponse> {
  return caieGet<CAIERevisionResponse>(`/attempts/revision?user_id=${encodeURIComponent(userId)}`)
}
