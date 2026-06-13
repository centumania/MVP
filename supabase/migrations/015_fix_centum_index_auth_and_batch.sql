-- =============================================================================
-- Migration: 015_fix_centum_index_auth_and_batch.sql
--
-- FIX M-1: calculate_centum_index() was SECURITY DEFINER with no caller check —
--          any authenticated student could call it for ANY user_id via RPC.
--          Added: caller must be the student themselves OR an admin.
--
-- FIX C-3: mcq_attempts were fetched with no batch filter — returning students
--          in Batch 2 would have their accuracy polluted by Batch 1 attempts.
--          Added: join through node_assignments to scope to the active batch.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_centum_index(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch_id    UUID;
  v_conducted   INT     := 0;
  v_submitted   INT     := 0;
  v_attendance  NUMERIC := 0;
  v_assigned    INT     := 0;
  v_completed   INT     := 0;
  v_completion  NUMERIC := 0;
  v_fa_total    INT     := 0;
  v_fa_correct  INT     := 0;
  v_accuracy    NUMERIC := 0;
  v_node_index  NUMERIC := 0;
  v_centum      NUMERIC := 0;
BEGIN
  -- Auth guard: student may only calculate their own index; admins may calculate any
  IF NOT public.requesting_user_is_admin() AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot calculate centum index for another user';
  END IF;

  -- Resolve active batch
  SELECT id INTO v_batch_id
  FROM public.batches
  WHERE is_active = true
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active batch found');
  END IF;

  -- Attendance: tests published up to today vs student submissions
  SELECT COUNT(dt.id), COUNT(ts.id)
  INTO v_conducted, v_submitted
  FROM public.daily_tests dt
  LEFT JOIN public.test_submissions ts
    ON ts.test_id = dt.id AND ts.user_id = p_user_id
  WHERE dt.batch_id = v_batch_id
    AND dt.test_date <= CURRENT_DATE
    AND dt.is_published = true;

  IF v_conducted > 0 THEN
    v_attendance := ROUND((v_submitted::NUMERIC / v_conducted) * 100, 2);
  END IF;

  -- Node completion: assigned nodes up to today vs completed
  SELECT COUNT(na.id), COUNT(np.id) FILTER (WHERE np.is_completed = true)
  INTO v_assigned, v_completed
  FROM public.node_assignments na
  LEFT JOIN public.node_progress np
    ON np.node_id = na.node_id AND np.user_id = p_user_id
  WHERE na.batch_id = v_batch_id
    AND na.assigned_date <= CURRENT_DATE;

  IF v_assigned > 0 THEN
    v_completion := ROUND((v_completed::NUMERIC / v_assigned) * 100, 2);
  END IF;

  -- First attempt accuracy — scoped to nodes assigned in the active batch only
  -- (prevents Batch 1 attempts from polluting Batch 2 calculations)
  SELECT
    COUNT(*) FILTER (WHERE ma.attempt_number = 1),
    COUNT(*) FILTER (WHERE ma.attempt_number = 1 AND ma.is_correct = true)
  INTO v_fa_total, v_fa_correct
  FROM public.mcq_attempts ma
  JOIN public.node_assignments na
    ON na.node_id = ma.node_id AND na.batch_id = v_batch_id
  WHERE ma.user_id = p_user_id;

  IF v_fa_total > 0 THEN
    v_accuracy := ROUND((v_fa_correct::NUMERIC / v_fa_total) * 100, 2);
  END IF;

  -- Composite scores
  v_node_index := ROUND((v_completion * v_accuracy) / 100, 2);
  v_centum     := ROUND((v_attendance * 0.60) + (v_node_index * 0.40), 2);

  -- Upsert
  INSERT INTO public.centum_index_log (
    user_id, batch_id, calculated_date,
    tests_conducted, tests_submitted, attendance_index,
    nodes_assigned, nodes_completed, node_completion_pct,
    first_attempt_correct, first_attempt_total, first_attempt_acc_pct,
    node_index, centum_index
  ) VALUES (
    p_user_id, v_batch_id, CURRENT_DATE,
    v_conducted, v_submitted, v_attendance,
    v_assigned, v_completed, v_completion,
    v_fa_correct, v_fa_total, v_accuracy,
    v_node_index, v_centum
  )
  ON CONFLICT (user_id, calculated_date) DO UPDATE SET
    batch_id              = EXCLUDED.batch_id,
    tests_conducted       = EXCLUDED.tests_conducted,
    tests_submitted       = EXCLUDED.tests_submitted,
    attendance_index      = EXCLUDED.attendance_index,
    nodes_assigned        = EXCLUDED.nodes_assigned,
    nodes_completed       = EXCLUDED.nodes_completed,
    node_completion_pct   = EXCLUDED.node_completion_pct,
    first_attempt_correct = EXCLUDED.first_attempt_correct,
    first_attempt_total   = EXCLUDED.first_attempt_total,
    first_attempt_acc_pct = EXCLUDED.first_attempt_acc_pct,
    node_index            = EXCLUDED.node_index,
    centum_index          = EXCLUDED.centum_index;

  RETURN jsonb_build_object(
    'centum_index',          v_centum,
    'attendance_index',      v_attendance,
    'node_index',            v_node_index,
    'tests_conducted',       v_conducted,
    'tests_submitted',       v_submitted,
    'nodes_assigned',        v_assigned,
    'nodes_completed',       v_completed,
    'first_attempt_acc_pct', v_accuracy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_centum_index(UUID) IS
  'Calculates and upserts the Centum Index for one student based on the active batch. '
  'Formula: Centum = Attendance×60% + NodeIndex×40%. '
  'NodeIndex = (NodeCompletion% × FirstAttemptAccuracy%) / 100. '
  'MCQ accuracy is scoped to the active batch via node_assignments join. '
  'Auth guard: students may only calculate their own; admins may calculate any.';
