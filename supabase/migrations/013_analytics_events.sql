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
