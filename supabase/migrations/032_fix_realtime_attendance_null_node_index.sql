-- 032: Fix NULL centum_index crash in update_realtime_attendance.
--
-- Bug (found 2026-07-24 via DEV end-to-end verification): the function does
--   SELECT COALESCE(cil.node_index, 0) INTO v_node_index
--   FROM centum_index_log WHERE ... calculated_date = CURRENT_DATE;
-- When NO row exists for the user for today (the FIRST daily-test submission of
-- a new day, before the nightly calculate_centum_index seeds today's row),
-- SELECT INTO returns zero rows and assigns NULL to v_node_index — the inline
-- COALESCE never executes because there is no row to project. Then
--   v_centum := attendance*0.60 + NULL*0.40  ->  NULL
-- and the INSERT violates centum_index NOT NULL, so the RPC throws. The grade
-- route calls this inside try/catch, so the throw is swallowed and attendance
-- silently fails to record on the first submission each day.
--
-- Fix: guard v_node_index and v_centum with COALESCE so a missing today-row is
-- treated as node_index 0 (correct — the nightly job fills the real node score
-- later and preserves it). Behaviour is otherwise identical. Idempotent
-- CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.update_realtime_attendance(p_user_id uuid, p_batch_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT cil.node_index
  INTO   v_node_index
  FROM   public.centum_index_log cil
  WHERE  cil.user_id         = p_user_id
    AND  cil.calculated_date = CURRENT_DATE
  LIMIT 1;

  -- CRITICAL: SELECT INTO assigns NULL when no row is found (first submission
  -- of the day). Coalesce to 0 so centum_index is never NULL.
  v_node_index := COALESCE(v_node_index, 0);

  v_centum := ROUND((v_attendance_pct * 0.60) + (COALESCE(v_node_index, 0) * 0.40), 2);

  -- Upsert: conflict on (user_id, calculated_date). Partial update — only the
  -- columns this function owns; node_*, first_attempt_*, node_index untouched.
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
END;
$function$;
