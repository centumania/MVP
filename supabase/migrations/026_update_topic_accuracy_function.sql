-- =============================================================================
-- Migration 026: update_topic_accuracy_after_submission()
--
-- Called explicitly by the API route that submits a Centum Index daily test,
-- AFTER both test_submissions and test_submission_answers rows are inserted.
--
-- WHY NOT A DB TRIGGER:
--   A trigger on AFTER INSERT ON test_submissions fires before answer rows
--   exist (answers are always inserted after the submission row, per the
--   established pattern in /api/exam/submit). At trigger time,
--   test_submission_answers WHERE submission_id = NEW.id returns 0 rows,
--   producing no topic updates. The API-call pattern is used instead:
--   the submit endpoint calls this function explicitly after inserting answers.
--
-- Idempotent: CREATE OR REPLACE FUNCTION.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_topic_accuracy_after_submission(
  p_submission_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Resolve the owning user
  SELECT ts.user_id
  INTO   v_user_id
  FROM   public.test_submissions ts
  WHERE  ts.id = p_submission_id;

  IF v_user_id IS NULL THEN
    RAISE WARNING 'update_topic_accuracy_after_submission: submission % not found — skipping', p_submission_id;
    RETURN;
  END IF;

  -- Aggregate per-topic counts from test_submission_answers joined to questions
  -- then upsert into student_topic_accuracy (increment running totals).
  INSERT INTO public.student_topic_accuracy (
    user_id,
    topic,
    total_attempted,
    total_correct,
    last_updated
  )
  SELECT
    v_user_id,
    q.topic,
    COUNT(*)::integer                                          AS total_attempted,
    COUNT(*) FILTER (WHERE tsa.is_correct = true)::integer    AS total_correct,
    now()
  FROM public.test_submission_answers tsa
  JOIN public.questions               q   ON q.id = tsa.question_id
  WHERE tsa.submission_id = p_submission_id
  GROUP BY q.topic
  ON CONFLICT (user_id, topic) DO UPDATE SET
    total_attempted = public.student_topic_accuracy.total_attempted + EXCLUDED.total_attempted,
    total_correct   = public.student_topic_accuracy.total_correct   + EXCLUDED.total_correct,
    last_updated    = now();
END;
$$;

COMMENT ON FUNCTION public.update_topic_accuracy_after_submission(uuid) IS
  'Increments per-topic attempted/correct counts after a Centum Index daily test. '
  'Must be called after test_submission_answers rows are inserted (not via trigger). '
  'Safe to call multiple times for the same submission_id — double-counts if called twice.';

-- Grant execute to authenticated so a service-role caller can invoke via RPC.
GRANT EXECUTE ON FUNCTION public.update_topic_accuracy_after_submission(uuid) TO authenticated;
