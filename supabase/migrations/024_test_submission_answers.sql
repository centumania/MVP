-- =============================================================================
-- Migration 024: test_submission_answers table
--
-- WHY A SEPARATE TABLE (not reusing submission_answers):
--   submission_answers.submission_id has a FK → public.submissions(id).
--   test_submissions.id is not in the submissions table, so inserting a
--   test submission's answers into submission_answers would fail with a
--   foreign-key violation.
--   This table provides the same structure with the correct FK target.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
--             CREATE POLICY ... (skipped if already exists via DO block).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.test_submission_answers (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  submission_id   uuid          NOT NULL REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  question_id     uuid          NOT NULL REFERENCES public.questions(id)       ON DELETE CASCADE,
  selected_answer answer_option NOT NULL,
  is_correct      boolean       NOT NULL,

  CONSTRAINT test_submission_answers_pkey            PRIMARY KEY (id),
  CONSTRAINT test_submission_answers_one_per_question UNIQUE (submission_id, question_id)
);

COMMENT ON TABLE public.test_submission_answers IS
  'Per-question answer record for Centum Index daily tests (test_submissions). '
  'Mirrors submission_answers but references test_submissions, not submissions.';

CREATE INDEX IF NOT EXISTS idx_tsa_submission_id
  ON public.test_submission_answers (submission_id);

CREATE INDEX IF NOT EXISTS idx_tsa_question_id
  ON public.test_submission_answers (question_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.test_submission_answers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'test_submission_answers'
      AND policyname = 'tsa_student_reads_own'
  ) THEN
    CREATE POLICY "tsa_student_reads_own"
      ON public.test_submission_answers FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.test_submissions ts
          WHERE ts.id      = test_submission_answers.submission_id
            AND ts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'test_submission_answers'
      AND policyname = 'tsa_student_inserts_own'
  ) THEN
    CREATE POLICY "tsa_student_inserts_own"
      ON public.test_submission_answers FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.test_submissions ts
          WHERE ts.id      = test_submission_answers.submission_id
            AND ts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'test_submission_answers'
      AND policyname = 'tsa_admin_full_access'
  ) THEN
    CREATE POLICY "tsa_admin_full_access"
      ON public.test_submission_answers FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;
