# Analytics Phase 1 — Event Collection Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fire-and-forget event collection layer that records student interactions into a new `analytics_events` table without touching any existing functionality.

**Architecture:** One new migration (additive SQL only), one new client helper (`track.ts`), one new API route (`POST /api/events`), and minimal additions (~5 lines total) to two existing pages. Failures are always silent. No existing table, route, or component logic is altered.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + Auth), Vitest for unit tests, existing `getSupabaseBrowserClient` / `getSupabaseAdminClient` clients.

---

## Rollback (read this before starting)

If anything goes wrong at any task, full rollback is:
```sql
DROP TABLE IF EXISTS public.analytics_events CASCADE;
```
Plus delete `src/lib/analytics/track.ts` and `src/app/api/events/route.ts`, and revert the minimal additions to the two page files. This returns the app to its exact current state.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| CREATE | `supabase/migrations/013_analytics_events.sql` | New table, indexes, RLS |
| CREATE | `src/lib/analytics/track.ts` | Client event helper (never throws) |
| CREATE | `src/app/api/events/route.ts` | POST /api/events server route |
| CREATE | `tests/unit/analytics-track.test.ts` | Unit tests for pure helper logic |
| MODIFY (+3 lines) | `src/app/dashboard/page.tsx` | Fire `login` event on session confirmed |
| MODIFY (+5 lines) | `src/app/materials/viewer/[id]/page.tsx` | Fire `material_opened` + `daily_material_completed` |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/013_analytics_events.sql`

- [ ] **Step 1.1: Create the migration file**

Create `supabase/migrations/013_analytics_events.sql` with the exact content below:

```sql
-- =============================================================================
-- Migration: 013_analytics_events.sql
--
-- Adds the analytics_events table for Phase 1 event collection.
-- ADDITIVE ONLY — zero changes to any existing table.
-- Reversible: DROP TABLE IF EXISTS public.analytics_events CASCADE;
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  event_id        UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  event_name      TEXT        NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT analytics_events_pkey PRIMARY KEY (event_id),
  CONSTRAINT analytics_events_name_check CHECK (
    event_name IN (
      'login',
      'material_opened',
      'daily_material_completed',
      'node_opened',
      'node_completed',
      'mcq_started',
      'mcq_completed'
    )
  )
);

COMMENT ON TABLE public.analytics_events IS
  'Append-only event log. Phase 1 of analytics system. '
  'Never read by students — admin SELECT only. '
  'Feeds Phase 4 aggregation jobs.';

-- Per-student time-ordered queries (most common)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON public.analytics_events (user_id, event_timestamp DESC);

-- Funnel / event-type queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON public.analytics_events (event_name, event_timestamp DESC);

-- Session grouping
CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON public.analytics_events (session_id)
  WHERE session_id IS NOT NULL;

-- JSONB field queries (future phases)
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_gin
  ON public.analytics_events USING GIN (metadata)
  WHERE metadata IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Students INSERT their own events only
CREATE POLICY "analytics_events: student inserts own"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students cannot read any events (privacy by default)
-- Admins see all
CREATE POLICY "analytics_events: admin reads all"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.requesting_user_is_admin());

CREATE POLICY "analytics_events: admin deletes"
  ON public.analytics_events FOR DELETE TO authenticated
  USING (public.requesting_user_is_admin());
```

- [ ] **Step 1.2: Run migration in Supabase SQL Editor**

Copy the file contents and paste into Supabase Dashboard → SQL Editor → Run.

Expected: "Success. No rows returned."

- [ ] **Step 1.3: Verify table exists**

Run in Supabase SQL Editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'analytics_events'
ORDER BY ordinal_position;
```

Expected: 7 rows — event_id, user_id, session_id, event_name, event_timestamp, metadata, created_at.

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/013_analytics_events.sql
git commit -m "feat: add analytics_events table (Phase 1 event collection)"
```

---

## Task 2: Client Event Helper

**Files:**
- Create: `src/lib/analytics/track.ts`
- Create: `tests/unit/analytics-track.test.ts`

This module must **never throw**. Every function is wrapped in try/catch. The `trackEvent` function is async (fire-and-forget). The `trackBeacon` function is synchronous using `navigator.sendBeacon` for use in `beforeunload` handlers where promises cannot resolve.

- [ ] **Step 2.1: Write the failing tests first**

Create `tests/unit/analytics-track.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ALLOWED_EVENTS, isAllowedEvent, getSessionId } from '../../src/lib/analytics/track'

describe('ALLOWED_EVENTS', () => {
  it('contains all 7 required event names', () => {
    expect(ALLOWED_EVENTS).toContain('login')
    expect(ALLOWED_EVENTS).toContain('material_opened')
    expect(ALLOWED_EVENTS).toContain('daily_material_completed')
    expect(ALLOWED_EVENTS).toContain('node_opened')
    expect(ALLOWED_EVENTS).toContain('node_completed')
    expect(ALLOWED_EVENTS).toContain('mcq_started')
    expect(ALLOWED_EVENTS).toContain('mcq_completed')
    expect(ALLOWED_EVENTS).toHaveLength(7)
  })
})

describe('isAllowedEvent', () => {
  it('returns true for valid event names', () => {
    expect(isAllowedEvent('login')).toBe(true)
    expect(isAllowedEvent('material_opened')).toBe(true)
    expect(isAllowedEvent('mcq_completed')).toBe(true)
  })

  it('returns false for unknown event names', () => {
    expect(isAllowedEvent('page_view')).toBe(false)
    expect(isAllowedEvent('')).toBe(false)
    expect(isAllowedEvent('LOGIN')).toBe(false)
  })
})

describe('getSessionId', () => {
  it('returns a non-empty string', () => {
    // getSessionId reads sessionStorage — not available in node test env,
    // but the function must not throw
    const id = getSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns the same value on repeated calls', () => {
    const first  = getSessionId()
    const second = getSessionId()
    expect(first).toBe(second)
  })
})
```

- [ ] **Step 2.2: Run tests — verify they fail**

```bash
cd /Users/prasannakumar/centumania-mvp && node_modules/.bin/vitest run tests/unit/analytics-track.test.ts 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '../../src/lib/analytics/track'"

- [ ] **Step 2.3: Create `src/lib/analytics/track.ts`**

```typescript
/**
 * Analytics event tracker — Phase 1.
 *
 * Rules:
 * - NEVER throws. All functions wrap in try/catch.
 * - trackEvent: async, fire-and-forget. Call without await.
 * - trackBeacon: sync, uses sendBeacon. For beforeunload handlers only.
 * - No new npm packages. Uses fetch and navigator.sendBeacon (both built-in).
 */

export const ALLOWED_EVENTS = [
  'login',
  'material_opened',
  'daily_material_completed',
  'node_opened',
  'node_completed',
  'mcq_started',
  'mcq_completed',
] as const

export type EventName = typeof ALLOWED_EVENTS[number]

export function isAllowedEvent(name: string): name is EventName {
  return (ALLOWED_EVENTS as readonly string[]).includes(name)
}

// Module-level session ID — one per browser page load. Stored in sessionStorage
// so it survives soft navigations but resets on new tab / window.
let _sessionId: string | null = null

export function getSessionId(): string {
  if (_sessionId) return _sessionId
  try {
    const stored = sessionStorage.getItem('cm:analytics_session')
    if (stored) { _sessionId = stored; return _sessionId }
    const id = crypto.randomUUID()
    sessionStorage.setItem('cm:analytics_session', id)
    _sessionId = id
  } catch {
    // sessionStorage not available (SSR, private mode) — use in-memory fallback
    if (!_sessionId) _sessionId = Math.random().toString(36).slice(2)
  }
  return _sessionId!
}

// Cached token for use in sendBeacon (beforeunload can't await session fetch)
let _cachedToken: string | null = null

export function setCachedToken(token: string): void {
  _cachedToken = token
}

/**
 * Fire-and-forget event. Call without await — failures are silently swallowed.
 * Reads the current Supabase session for auth token.
 */
export async function trackEvent(
  eventName: EventName,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    if (!_cachedToken) return  // no session yet — skip silently

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
    // Network failure, server error, anything — silently ignored
  }
}

/**
 * Synchronous beacon — use ONLY in beforeunload handlers.
 * navigator.sendBeacon is the only way to reliably send data on page unload.
 * Requires a cached token (set via setCachedToken when session is established).
 */
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
      _token:          _cachedToken,  // beacon can't set headers — token in body
    })

    navigator.sendBeacon('/api/events/beacon', payload)
  } catch {
    // Never throws
  }
}
```

- [ ] **Step 2.4: Run tests — verify they pass**

```bash
cd /Users/prasannakumar/centumania-mvp && node_modules/.bin/vitest run tests/unit/analytics-track.test.ts 2>&1 | tail -20
```

Expected:
```
✓ tests/unit/analytics-track.test.ts (5 tests)
Test Files  1 passed (1)
```

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/analytics/track.ts tests/unit/analytics-track.test.ts
git commit -m "feat: add analytics event tracker helper (fire-and-forget)"
```

---

## Task 3: API Route — POST /api/events

**Files:**
- Create: `src/app/api/events/route.ts`

This route follows the exact same pattern as existing routes (`/api/materials/open/[id]/route.ts`). Auth token from Bearer header. Admin client for user verification. Returns 200, 400, or 401 — never 500 from event payloads.

Note: There is also a `/api/events/beacon` route needed for `trackBeacon`. Since beacon can't set headers, the token arrives in the JSON body. This route is separate.

- [ ] **Step 3.1: Create `src/app/api/events/route.ts`**

```typescript
/**
 * POST /api/events
 *
 * Accepts analytics events from authenticated students.
 * Returns 200 on success, 400 on bad input, 401 on no auth.
 * Never returns 500 — event loss is acceptable, error surfacing is not.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { ALLOWED_EVENTS } from '@/src/lib/analytics/track'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event_name, session_id, event_timestamp, metadata } = body as Record<string, unknown>

    if (typeof event_name !== 'string' || !(ALLOWED_EVENTS as readonly string[]).includes(event_name)) {
      return NextResponse.json({ error: 'Unknown event_name' }, { status: 400 })
    }

    const ts = typeof event_timestamp === 'string' ? new Date(event_timestamp) : new Date()
    if (isNaN(ts.getTime())) {
      return NextResponse.json({ error: 'Invalid event_timestamp' }, { status: 400 })
    }

    await supabase.from('analytics_events').insert({
      user_id:         user.id,
      session_id:      typeof session_id === 'string' ? session_id : null,
      event_name:      event_name,
      event_timestamp: ts.toISOString(),
      metadata:        metadata && typeof metadata === 'object' ? metadata : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Swallow all errors — event loss is acceptable
    return NextResponse.json({ ok: true })
  }
}
```

- [ ] **Step 3.2: Create `src/app/api/events/beacon/route.ts`**

This handles `navigator.sendBeacon` calls where the auth token must come in the request body (beacon cannot set headers).

```typescript
/**
 * POST /api/events/beacon
 *
 * Beacon endpoint for beforeunload events (navigator.sendBeacon).
 * Token arrives in body as _token because beacon cannot set headers.
 * Same validation as /api/events — silently drops invalid payloads.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { ALLOWED_EVENTS } from '@/src/lib/analytics/track'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: true })  // beacon: never surface errors
    }

    const { _token, event_name, session_id, event_timestamp, metadata } = body as Record<string, unknown>

    if (typeof _token !== 'string') return NextResponse.json({ ok: true })
    if (typeof event_name !== 'string' || !(ALLOWED_EVENTS as readonly string[]).includes(event_name)) {
      return NextResponse.json({ ok: true })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(_token)
    if (error || !user) return NextResponse.json({ ok: true })

    const ts = typeof event_timestamp === 'string' ? new Date(event_timestamp) : new Date()
    if (isNaN(ts.getTime())) return NextResponse.json({ ok: true })

    await supabase.from('analytics_events').insert({
      user_id:         user.id,
      session_id:      typeof session_id === 'string' ? session_id : null,
      event_name,
      event_timestamp: ts.toISOString(),
      metadata:        metadata && typeof metadata === 'object' ? metadata : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
```

- [ ] **Step 3.3: Verify TypeScript compiles clean**

```bash
/Users/prasannakumar/centumania-mvp/node_modules/.bin/tsc --noEmit --project /Users/prasannakumar/centumania-mvp/tsconfig.json 2>&1
```

Expected: no output (no errors).

- [ ] **Step 3.4: Commit**

```bash
git add src/app/api/events/route.ts src/app/api/events/beacon/route.ts
git commit -m "feat: add POST /api/events and /api/events/beacon routes"
```

---

## Task 4: Dashboard Page — Login Event

**Files:**
- Modify: `src/app/dashboard/page.tsx` (lines 3-6 imports, lines 83-87 useEffect)

Only 3 lines change: 1 import added, 1 call to `setCachedToken`, 1 call to `trackEvent`.

- [ ] **Step 4.1: Add the import at the top of `src/app/dashboard/page.tsx`**

Find the existing imports block (lines 1-14). After line 6 (`import { getSupabaseBrowserClient }...`), add:

```typescript
import { trackEvent, setCachedToken } from '@/src/lib/analytics/track'
```

- [ ] **Step 4.2: Add token cache + login event in the useEffect**

Find this exact block (lines 82-94 in `src/app/dashboard/page.tsx`):

```typescript
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      fetchData(session.access_token)
    })
```

Replace it with:

```typescript
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      setCachedToken(session.access_token)
      trackEvent('login', {})
      fetchData(session.access_token)
    })
```

**What changed:** 2 lines added (`setCachedToken` and `trackEvent`). No logic altered.

- [ ] **Step 4.3: Verify TypeScript compiles clean**

```bash
/Users/prasannakumar/centumania-mvp/node_modules/.bin/tsc --noEmit --project /Users/prasannakumar/centumania-mvp/tsconfig.json 2>&1
```

Expected: no output.

- [ ] **Step 4.4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: fire login analytics event on dashboard load"
```

---

## Task 5: Viewer Page — Material Events

**Files:**
- Modify: `src/app/materials/viewer/[id]/page.tsx`

Three additions: import, `material_opened` event (fires before HTML redirect and when PDF loads), `daily_material_completed` beacon (fires on unload if ≥30s elapsed).

- [ ] **Step 5.1: Add imports at the top of the viewer page**

Find line 4 (`import { useRouter, useParams } from 'next/navigation'`). After the existing imports (lines 1-6), add:

```typescript
import { trackEvent, trackBeacon, setCachedToken } from '@/src/lib/analytics/track'
```

- [ ] **Step 5.2: Add time-tracking ref and unload handler**

Find the existing state declarations block (lines 13-17). After the `useState` declarations, add a ref for open time. Replace the entire component function opening through the first useEffect with:

Find this exact block (lines 19-61):
```typescript
  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const res = await fetch(`/api/materials/open/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (cancelled) return

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { setErrorMsg('Your payment is pending. Contact your coordinator.'); setState('error'); return }
      if (res.status === 404) { setErrorMsg('This material is no longer available.'); setState('error'); return }
      if (res.status === 429) { setErrorMsg('Too many requests. Please wait a moment and try again.'); setState('error'); return }
      if (!res.ok)            { setErrorMsg('Could not load material. Please try again.'); setState('error'); return }

      const data = await res.json() as
        | { type: 'pdf'; url: string }
        | { type: 'html'; url: string }

      if (cancelled) return

      // HTML: Netlify blocks iframing (X-Frame-Options). Redirect directly —
      // auth + payment have already been verified above.
      if (data.type === 'html') {
        window.location.href = data.url
        return
      }

      setContentType(data.type)
      setContentUrl(data.url)
      setState('ready')
    }

    load().catch(() => {
      if (!cancelled) { setErrorMsg('Unexpected error. Please refresh.'); setState('error') }
    })

    return () => { cancelled = true }
  }, [id, router])
```

Replace with:

```typescript
  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      setCachedToken(session.access_token)

      const res = await fetch(`/api/materials/open/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (cancelled) return

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { setErrorMsg('Your payment is pending. Contact your coordinator.'); setState('error'); return }
      if (res.status === 404) { setErrorMsg('This material is no longer available.'); setState('error'); return }
      if (res.status === 429) { setErrorMsg('Too many requests. Please wait a moment and try again.'); setState('error'); return }
      if (!res.ok)            { setErrorMsg('Could not load material. Please try again.'); setState('error'); return }

      const data = await res.json() as
        | { type: 'pdf'; url: string }
        | { type: 'html'; url: string }

      if (cancelled) return

      openedAtRef.current = Date.now()
      trackEvent('material_opened', { material_id: id, content_type: data.type })

      if (data.type === 'html') {
        window.location.href = data.url
        return
      }

      setContentType(data.type)
      setContentUrl(data.url)
      setState('ready')
    }

    load().catch(() => {
      if (!cancelled) { setErrorMsg('Unexpected error. Please refresh.'); setState('error') }
    })

    return () => { cancelled = true }
  }, [id, router])

  // Fire daily_material_completed on page unload if student spent ≥30 seconds
  useEffect(() => {
    function handleUnload() {
      const durationMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0
      if (durationMs >= 30_000) {
        trackBeacon('daily_material_completed', { material_id: id, duration_ms: durationMs })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [id])
```

Also add `useRef` to the React import on line 3 (it currently imports `useEffect, useState`):

Change:
```typescript
import { useEffect, useState } from 'react'
```
To:
```typescript
import { useEffect, useRef, useState } from 'react'
```

- [ ] **Step 5.3: Verify TypeScript compiles clean**

```bash
/Users/prasannakumar/centumania-mvp/node_modules/.bin/tsc --noEmit --project /Users/prasannakumar/centumania-mvp/tsconfig.json 2>&1
```

Expected: no output.

- [ ] **Step 5.4: Run all existing tests to confirm nothing broke**

```bash
/Users/prasannakumar/centumania-mvp/node_modules/.bin/vitest run 2>&1 | tail -20
```

Expected:
```
Test Files  2 passed (2)
Tests       X passed
```
(The existing exam-window tests must still pass.)

- [ ] **Step 5.5: Commit**

```bash
git add src/app/materials/viewer/[id]/page.tsx
git commit -m "feat: fire material_opened and daily_material_completed events in viewer"
```

---

## Task 6: Manual Verification

These steps verify end-to-end event collection works in the running app.

- [ ] **Step 6.1: Start the dev server**

```bash
cd /Users/prasannakumar/centumania-mvp && npm run dev
```

- [ ] **Step 6.2: Log in as a student and navigate to the dashboard**

Open `localhost:3000`. Sign in with a real student account (or the Prasanna admin account).

Expected: Dashboard loads identically to before. No visible change.

- [ ] **Step 6.3: Verify the login event was inserted**

In Supabase SQL Editor:
```sql
SELECT event_id, user_id, event_name, event_timestamp, created_at
FROM public.analytics_events
ORDER BY created_at DESC
LIMIT 5;
```

Expected: At least one row with `event_name = 'login'`.

- [ ] **Step 6.4: Open a material and verify material_opened event**

Navigate to `/materials`. Click "Open Study Material" on any material.

Then in Supabase SQL Editor:
```sql
SELECT event_name, metadata, event_timestamp
FROM public.analytics_events
ORDER BY created_at DESC
LIMIT 5;
```

Expected: A row with `event_name = 'material_opened'` and `metadata` containing `material_id`.

- [ ] **Step 6.5: Verify core flows are unaffected**

- [ ] Dashboard loads: students see their stats, streak, history
- [ ] Exam flow: opening an exam, submitting answers works
- [ ] Centum Index: `SELECT calculate_centum_index('<user-id>');` returns correct JSON in Supabase
- [ ] Admin students page: shows phone numbers (from previous fix)
- [ ] Materials list: shows Day 1, Day 2 cards

---

## Success Criteria Checklist

- [ ] `analytics_events` table exists with correct schema
- [ ] Login event fires and appears in DB
- [ ] `material_opened` event fires on viewer load
- [ ] All existing Vitest tests pass
- [ ] Dashboard loads identically to before
- [ ] Exam submission works identically
- [ ] Centum Index calculation is unaffected
- [ ] TypeScript compiles with zero errors throughout
