-- =============================================================================
-- Migration 027: update_realtime_attendance()
--
-- Updates the attendance-related sub-scores in centum_index_log immediately
-- after a student submits a Centum Index daily test.
-- Called explicitly by the test-submit API route (same call-site pattern as
-- update_topic_accuracy_after_submission).
--
-- ONLY touches: tests_submitted, tests_conducted, attendance_index, centum_index.
-- NEVER touches: nodes_assigned, nodes_completed, node_completion_pct,
--                first_attempt_*, node_index  — those stay in the nightly cron.
-- centum_index is recalculated using the EXISTING node_index from today's row
-- (or 0 if no row yet) so the nightly cron's node calculations are preserved.
--
-- CONFLICT TARGET CORRECTION:
--   centum_index_log has UNIQUE (user_id, calculated_date) — no batch_id.
--   Using the correct conflict target here (not user+batch+date which doesn't exist).
--
-- Idempotent: CREATE OR REPLACE FUNCTION.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_realtime_attendance(
  p_user_id  uuid,
  p_batch_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tests_submitted integer := 0;
  v_tests_conducted integer := 0;
  v_attendance_pct  numeric := 0;
  v_node_index      numeric := 0;
  v_centum          numeric := 0;
BEGIN
  -- Count this user's submissions in this batch
  SELECT COUNT(*)::integer
  INTO   v_tests_submitted
  FROM   public.test_submissions ts
  JOIN   public.daily_tests      dt ON dt.id = ts.test_id
  WHERE  ts.user_id   = p_user_id
    AND  dt.batch_id  = p_batch_id;

  -- Count all published tests for this batch up to today (conducted)
  SELECT COUNT(*)::integer
  INTO   v_tests_conducted
  FROM   public.daily_tests dt
  WHERE  dt.batch_id   = p_batch_id
    AND  dt.is_published = true
    AND  dt.test_date   <= CURRENT_DATE;

  IF v_tests_conducted = 0 THEN
    RETURN;  -- Nothing to compute yet
  END IF;

  v_attendance_pct := ROUND((v_tests_submitted::numeric / v_tests_conducted) * 100, 2);

  -- Read today's existing node_index to preserve it in the centum recalculation.
  -- Returns 0 via COALESCE if no row exists yet for today.
  SELECT COALESCE(cil.node_index, 0)
  INTO   v_node_index
  FROM   public.centum_index_log cil
  WHERE  cil.user_id         = p_user_id
    AND  cil.calculated_date = CURRENT_DATE
  LIMIT 1;

  v_centum := ROUND((v_attendance_pct * 0.60) + (v_node_index * 0.40), 2);

  -- Upsert: conflict on (user_id, calculated_date) — the actual unique constraint.
  -- Partial update: only the columns this function owns.
  INSERT INTO public.centum_index_log (
    user_id,
    batch_id,
    calculated_date,
    tests_submitted,
    tests_conducted,
    attendance_index,
    centum_index
  ) VALUES (
    p_user_id,
    p_batch_id,
    CURRENT_DATE,
    v_tests_submitted,
    v_tests_conducted,
    v_attendance_pct,
    v_centum
  )
  ON CONFLICT (user_id, calculated_date) DO UPDATE SET
    batch_id         = EXCLUDED.batch_id,
    tests_submitted  = EXCLUDED.tests_submitted,
    tests_conducted  = EXCLUDED.tests_conducted,
    attendance_index = EXCLUDED.attendance_index,
    centum_index     = EXCLUDED.centum_index;
    -- node_*, first_attempt_*, node_index intentionally NOT touched here
END;
$$;

COMMENT ON FUNCTION public.update_realtime_attendance(uuid, uuid) IS
  'Real-time partial update to centum_index_log after a daily test submission. '
  'Updates tests_submitted, tests_conducted, attendance_index, centum_index only. '
  'Node-related columns are managed exclusively by the nightly calculate_centum_index cron. '
  'Conflict target: UNIQUE(user_id, calculated_date).';

GRANT EXECUTE ON FUNCTION public.update_realtime_attendance(uuid, uuid) TO authenticated;
