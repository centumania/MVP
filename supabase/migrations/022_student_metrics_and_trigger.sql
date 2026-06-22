-- =============================================================================
-- Migration 022: student_metrics table + auto-update trigger + leaderboard fix
--
-- What this does:
--   1. Updates analytics_events CHECK constraint to allow all current event names
--      (7 new names added in the last track.ts update were blocked at the DB level)
--   2. Creates student_metrics table — aggregated per-student engagement metrics
--   3. Creates trigger: after every analytics_event insert, recomputes that
--      student's metrics row (fast, per-user aggregation, not a full table scan)
--   4. Creates refresh_student_metrics() — full-table recalculation for admin/cron
--   5. Replaces study_leaderboard view to include engagement_score in total_score
--
-- Reversible:
--   DROP TRIGGER  IF EXISTS trg_analytics_events_update_metrics ON public.analytics_events;
--   DROP FUNCTION IF EXISTS public.update_student_metrics_on_event() CASCADE;
--   DROP FUNCTION IF EXISTS public.refresh_student_metrics() CASCADE;
--   DROP TABLE    IF EXISTS public.student_metrics CASCADE;
--   Then re-run migration 020 to restore the old study_leaderboard view.
-- =============================================================================


-- =============================================================================
-- 1. Fix analytics_events CHECK constraint
--    The original constraint (migration 013) only allowed 7 event names.
--    New events were added to track.ts (session_start, session_end, node_open,
--    tab_switch, test_start, answer, test_finish) but the DB still rejects them.
-- =============================================================================

ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_name_check;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_name_check CHECK (
    event_name IN (
      -- original events
      'login',
      'material_opened',
      'daily_material_completed',
      'node_opened',
      'node_completed',
      'mcq_started',
      'mcq_completed',
      -- geography / new material events (added 2026-06)
      'session_start',
      'session_end',
      'node_open',
      'tab_switch',
      'test_start',
      'answer',
      'test_finish'
    )
  );


-- =============================================================================
-- 2. student_metrics table
--    One row per student. Upserted on every analytics_event insert.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_metrics (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  materials_opened  INTEGER     NOT NULL DEFAULT 0,
  nodes_opened      INTEGER     NOT NULL DEFAULT 0,
  nodes_completed   INTEGER     NOT NULL DEFAULT 0,
  mcqs_completed    INTEGER     NOT NULL DEFAULT 0,
  mcqs_correct      INTEGER     NOT NULL DEFAULT 0,
  study_sessions    INTEGER     NOT NULL DEFAULT 0,
  engagement_score  INTEGER     NOT NULL DEFAULT 0,
  last_event_at     TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.student_metrics IS
  'Aggregated per-student engagement metrics. '
  'Auto-maintained by trg_analytics_events_update_metrics. '
  'Admin-readable only. Feeds into study_leaderboard engagement_score.';

COMMENT ON COLUMN public.student_metrics.engagement_score IS
  'Weighted sum: material_opened×10 + node_opened×5 + node_completed×20 + mcq_completed×15 + session_start×10';

-- Index for leaderboard join
CREATE INDEX IF NOT EXISTS idx_student_metrics_engagement
  ON public.student_metrics (engagement_score DESC);


-- RLS
ALTER TABLE public.student_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_metrics: admin reads all"
  ON public.student_metrics FOR SELECT TO authenticated
  USING (public.requesting_user_is_admin());

CREATE POLICY "student_metrics: no student access"
  ON public.student_metrics FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());


-- =============================================================================
-- 3a. Per-event trigger function
--     Runs after each INSERT into analytics_events.
--     Scans only the inserting user's events — O(events_per_user), not O(all_events).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_student_metrics_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_metrics (
    user_id,
    materials_opened,
    nodes_opened,
    nodes_completed,
    mcqs_completed,
    mcqs_correct,
    study_sessions,
    engagement_score,
    last_event_at,
    updated_at
  )
  SELECT
    NEW.user_id,
    COUNT(*) FILTER (WHERE event_name = 'material_opened'),
    COUNT(*) FILTER (WHERE event_name IN ('node_opened', 'node_open')),
    COUNT(*) FILTER (WHERE event_name IN ('node_completed', 'test_finish')),
    COUNT(*) FILTER (WHERE event_name IN ('mcq_completed', 'test_finish')),
    COALESCE(SUM(
      CASE
        WHEN event_name IN ('mcq_completed', 'test_finish')
         AND (metadata->>'pct') ~ '^[0-9]+\.?[0-9]*$'
         AND (metadata->>'pct')::numeric >= 60
        THEN 1
        ELSE 0
      END
    ), 0)::integer,
    COUNT(*) FILTER (WHERE event_name = 'session_start'),
    (
      COUNT(*) FILTER (WHERE event_name = 'material_opened')            * 10 +
      COUNT(*) FILTER (WHERE event_name IN ('node_opened', 'node_open')) * 5  +
      COUNT(*) FILTER (WHERE event_name IN ('node_completed', 'test_finish')) * 20 +
      COUNT(*) FILTER (WHERE event_name IN ('mcq_completed', 'test_finish')) * 15 +
      COUNT(*) FILTER (WHERE event_name = 'session_start')              * 10
    )::integer,
    MAX(event_timestamp),
    NOW()
  FROM public.analytics_events
  WHERE user_id = NEW.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    materials_opened  = EXCLUDED.materials_opened,
    nodes_opened      = EXCLUDED.nodes_opened,
    nodes_completed   = EXCLUDED.nodes_completed,
    mcqs_completed    = EXCLUDED.mcqs_completed,
    mcqs_correct      = EXCLUDED.mcqs_correct,
    study_sessions    = EXCLUDED.study_sessions,
    engagement_score  = EXCLUDED.engagement_score,
    last_event_at     = EXCLUDED.last_event_at,
    updated_at        = NOW();

  RETURN NEW;
END;
$$;

-- Wire trigger
DROP TRIGGER IF EXISTS trg_analytics_events_update_metrics ON public.analytics_events;

CREATE TRIGGER trg_analytics_events_update_metrics
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_metrics_on_event();


-- =============================================================================
-- 3b. Full-recalculation function (for admin endpoint + cron)
--     Rescans ALL events for ALL students. Use when:
--     - First-time backfill of historical events
--     - Engagement formula changes
--     - Trigger was disabled/missed events
-- =============================================================================

CREATE OR REPLACE FUNCTION public.refresh_student_metrics()
RETURNS TABLE(students_updated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  INSERT INTO public.student_metrics (
    user_id,
    materials_opened,
    nodes_opened,
    nodes_completed,
    mcqs_completed,
    mcqs_correct,
    study_sessions,
    engagement_score,
    last_event_at,
    updated_at
  )
  SELECT
    ae.user_id,
    COUNT(*) FILTER (WHERE ae.event_name = 'material_opened'),
    COUNT(*) FILTER (WHERE ae.event_name IN ('node_opened', 'node_open')),
    COUNT(*) FILTER (WHERE ae.event_name IN ('node_completed', 'test_finish')),
    COUNT(*) FILTER (WHERE ae.event_name IN ('mcq_completed', 'test_finish')),
    COALESCE(SUM(
      CASE
        WHEN ae.event_name IN ('mcq_completed', 'test_finish')
         AND (ae.metadata->>'pct') ~ '^[0-9]+\.?[0-9]*$'
         AND (ae.metadata->>'pct')::numeric >= 60
        THEN 1
        ELSE 0
      END
    ), 0)::integer,
    COUNT(*) FILTER (WHERE ae.event_name = 'session_start'),
    (
      COUNT(*) FILTER (WHERE ae.event_name = 'material_opened')              * 10 +
      COUNT(*) FILTER (WHERE ae.event_name IN ('node_opened', 'node_open'))  * 5  +
      COUNT(*) FILTER (WHERE ae.event_name IN ('node_completed', 'test_finish')) * 20 +
      COUNT(*) FILTER (WHERE ae.event_name IN ('mcq_completed', 'test_finish'))  * 15 +
      COUNT(*) FILTER (WHERE ae.event_name = 'session_start')                * 10
    )::integer,
    MAX(ae.event_timestamp),
    NOW()
  FROM public.analytics_events ae
  GROUP BY ae.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    materials_opened  = EXCLUDED.materials_opened,
    nodes_opened      = EXCLUDED.nodes_opened,
    nodes_completed   = EXCLUDED.nodes_completed,
    mcqs_completed    = EXCLUDED.mcqs_completed,
    mcqs_correct      = EXCLUDED.mcqs_correct,
    study_sessions    = EXCLUDED.study_sessions,
    engagement_score  = EXCLUDED.engagement_score,
    last_event_at     = EXCLUDED.last_event_at,
    updated_at        = NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN QUERY SELECT updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_student_metrics() TO authenticated;


-- =============================================================================
-- 4. Replace study_leaderboard view
--    total_score now = quiz_score (daily_test_scores) + engagement_score (student_metrics)
--    Rank breaks ties by days_attended as before.
-- =============================================================================

CREATE OR REPLACE VIEW public.study_leaderboard AS
  SELECT
    p.id                                                                           AS user_id,
    p.name,
    p.tier,
    COALESCE(SUM(d.score), 0) + COALESCE(MAX(sm.engagement_score), 0)             AS total_score,
    COUNT(d.id)::integer                                                           AS days_attended,
    CASE
      WHEN SUM(d.total) = 0 OR SUM(d.total) IS NULL THEN 0
      ELSE ROUND((SUM(d.score)::numeric / SUM(d.total)::numeric) * 100, 1)
    END                                                                            AS accuracy_percent,
    RANK() OVER (
      ORDER BY
        (COALESCE(SUM(d.score), 0) + COALESCE(MAX(sm.engagement_score), 0)) DESC,
        COUNT(d.id) DESC
    )::integer                                                                     AS rank
  FROM public.profiles p
  LEFT JOIN public.daily_test_scores  d  ON d.user_id  = p.id
  LEFT JOIN public.student_metrics    sm ON sm.user_id = p.id
  WHERE p.payment_verified = true
    AND p.is_admin         = false
  GROUP BY p.id, p.name, p.tier;

COMMENT ON VIEW public.study_leaderboard IS
  'Unified study rank. total_score = quiz scores + engagement score from analytics events. '
  'Updated in real-time: engagement_score column in student_metrics is kept current by trigger.';

GRANT SELECT ON public.study_leaderboard TO authenticated;
