# Analytics Phase 1 — Event Collection Layer
**Date:** 2026-06-12  
**Status:** Awaiting user approval  
**Author:** Design session with Prasanna  
**Scope:** Additive only — zero changes to existing working functionality

---

## Hard Constraints (non-negotiable)

1. **No existing table is modified.** Zero ALTER TABLE on profiles, submissions, materials, node_progress, mcq_attempts, centum_index_log, or any other existing table.
2. **No existing API route is modified** in ways that change behaviour. Only additive lines (fire-and-forget event calls) added to existing page components.
3. **Full rollback in under 5 minutes.** Reverting means: drop one table, delete three files, remove ~9 lines from two existing files. The product returns to its exact current state.
4. **Event failures are silent.** If the analytics API is down, times out, or returns an error, the user sees nothing and the core action completes normally.
5. **No new npm packages.** Uses only existing Supabase browser client already in the project.

---

## Rollback Strategy

| What was added | How to undo |
|---|---|
| `supabase/migrations/013_analytics_events.sql` | Run `DROP TABLE IF EXISTS public.analytics_events CASCADE;` in Supabase SQL Editor |
| `src/lib/analytics/track.ts` | Delete the file |
| `src/app/api/events/route.ts` | Delete the file |
| Lines added to `viewer/[id]/page.tsx` | Remove the 3 trackEvent() call lines |
| Lines added to `dashboard/page.tsx` | Remove the 1 trackEvent() call line |

**Recovery time: < 5 minutes. No data loss to existing students.**

---

## What This Phase Builds

A raw event log that records student interactions without affecting any existing functionality. This is the data foundation for future analytics (Phase 2–9).

**No analytics are shown to students or admins in this phase.** This phase only collects data.

---

## Architecture

```
Next.js Pages (existing, minimally touched)
        │
        │ fire-and-forget (never blocks UI)
        ▼
POST /api/events  ← NEW API route
        │
        │ validates auth + event name, then inserts
        ▼
analytics_events  ← NEW TABLE (append-only)
        │
        │ read-only source (future phases)
        ▼
[Phase 4] Aggregation jobs
[Phase 5] Analytics API
[Phase 6] Dashboard widgets
```

**Existing data flow is completely unchanged.** The new path is additive and parallel.

---

## New Table: `analytics_events`

```sql
CREATE TABLE public.analytics_events (
  event_id        UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  event_name      TEXT        NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (event_id)
);
```

**Indexes:**
- `(user_id, event_timestamp DESC)` — per-student history
- `(event_name, event_timestamp DESC)` — funnel analysis
- `(session_id)` — session grouping
- `GIN (metadata)` — JSONB queries at scale

**RLS:**
- Students: INSERT own rows only (`user_id = auth.uid()`)
- Students: no SELECT (privacy by default)
- Admins: full SELECT

---

## Event Catalog

| Event Name | Trigger Location | Required Metadata | Optional Metadata |
|---|---|---|---|
| `login` | `dashboard/page.tsx` after session confirmed | — | `method`, `device` |
| `material_opened` | `viewer/[id]/page.tsx` on successful API response | `material_id` | `day_number`, `content_type`, `title` |
| `daily_material_completed` | `viewer/[id]/page.tsx` on page unload after ≥30s | `material_id`, `day_number` | `duration_ms` |
| `node_opened` | wherever node_progress visited_at is written | `node_id` | `node_type`, `topic_id` |
| `node_completed` | wherever `is_completed = true` is set | `node_id` | `duration_ms`, `node_type` |
| `mcq_started` | wherever first mcq_attempt is inserted | `node_id`, `question_id` | — |
| `mcq_completed` | after mcq_attempt insert (with result) | `node_id`, `question_id`, `is_correct`, `attempt_number` | `duration_ms` |

---

## New Files

### `src/lib/analytics/track.ts`
Client-side helper. ~40 lines. Reads the active session, POSTs to `/api/events`. Catches all errors silently. Never throws.

### `src/app/api/events/route.ts`
Server API route. ~80 lines. Validates auth token (same pattern as existing routes). Validates `event_name` is in the allowed list (whitelist). Inserts to `analytics_events`. Returns 200 on success, 400 on bad input, 401 on no auth. Ignores validation errors at insert level — never surfaces to user.

### `supabase/migrations/013_analytics_events.sql`
Creates the table, indexes, and RLS policies. Fully idempotent (`CREATE TABLE IF NOT EXISTS`). Reversible with one SQL statement.

---

## Existing Files Modified (minimal)

### `src/app/dashboard/page.tsx`
**Change:** Add 1 call after session is confirmed.
```typescript
// +1 line — fire-and-forget, no await needed
trackEvent('login', {})
```
No logic changed. If `trackEvent` throws (it won't), it's caught inside the helper.

### `src/app/materials/viewer/[id]/page.tsx`
**Change:** Add 2 calls — one on material open, one on completion.
```typescript
// +1 line on successful API response
trackEvent('material_opened', { material_id: id, content_type: data.type })

// +1 line in cleanup / unload handler (≥30s guard already in place)
trackEvent('daily_material_completed', { material_id: id, day_number })
```
Viewer logic, iframe rendering, auth/payment checks — all untouched.

---

## Scaling Notes

| Student Count | Strategy |
|---|---|
| 27 — 1,000 | Single table, no partitioning needed |
| 1,000 — 10,000 | Add partial indexes; consider monthly partitions |
| 10,000 — 100,000 | Monthly range partitioning on `event_timestamp`; archive cold months to cheaper storage |

Partitioning is a future migration, not part of this phase.

---

## What This Phase Does NOT Do

- Does not show any analytics to students
- Does not show any analytics to admins
- Does not change the Centum Index calculation
- Does not add any new npm packages
- Does not modify existing RLS policies
- Does not change existing API response shapes
- Does not implement recommendation logic
- Does not backfill historical events (no history exists to backfill for events)

---

## Success Criteria for Phase 1

- [ ] `analytics_events` table exists in Supabase
- [ ] Logging in fires a `login` event visible in the table
- [ ] Opening a material fires a `material_opened` event
- [ ] All existing tests still pass
- [ ] Existing student dashboard loads identically
- [ ] Existing exam flow works identically
- [ ] Existing Centum Index calculation works identically
