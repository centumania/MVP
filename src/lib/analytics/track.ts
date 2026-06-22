export const ALLOWED_EVENTS = [
  'login',
  'material_opened',
  'daily_material_completed',
  'node_opened',
  'node_completed',
  'mcq_started',
  'mcq_completed',
  'session_start',
  'session_end',
  'node_open',
  'tab_switch',
  'test_start',
  'answer',
  'test_finish',
] as const

export type EventName = typeof ALLOWED_EVENTS[number]

export function isAllowedEvent(name: string): name is EventName {
  return (ALLOWED_EVENTS as readonly string[]).includes(name)
}

let _sessionId: string | null = null

export function getSessionId(): string {
  if (_sessionId) return _sessionId
  try {
    const stored = sessionStorage.getItem('cm:analytics_session')
    if (stored) { _sessionId = stored; return _sessionId }
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
    sessionStorage.setItem('cm:analytics_session', id)
    _sessionId = id
  } catch {
    if (!_sessionId) _sessionId = Math.random().toString(36).slice(2)
  }
  return _sessionId ?? Math.random().toString(36).slice(2)
}

let _cachedToken: string | null = null

export function setCachedToken(token: string | null): void {
  _cachedToken = token
}

export async function trackEvent(
  eventName: EventName,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    if (!_cachedToken) return

    await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_cachedToken}`,
      },
      body: JSON.stringify({
        event_name:      eventName,
        session_id:      getSessionId(),
        event_timestamp: new Date().toISOString(),
        metadata,
      }),
    })
  } catch {
    // Network failure or any error — silently ignored
  }
}

export function trackBeacon(
  eventName: EventName,
  metadata: Record<string, unknown> = {},
): void {
  try {
    if (!_cachedToken || typeof navigator === 'undefined') return

    const payload = JSON.stringify({
      event_name:      eventName,
      session_id:      getSessionId(),
      event_timestamp: new Date().toISOString(),
      metadata,
      _token:          _cachedToken,
    })

    // sendBeacon can't set headers — send as Blob to control Content-Type.
    // _token in body is intentional: sendBeacon cannot set Authorization header.
    // The beacon endpoint validates _token then discards it before inserting.
    navigator.sendBeacon('/api/events/beacon', new Blob([payload], { type: 'application/json' }))
  } catch {
    // Never throws
  }
}
