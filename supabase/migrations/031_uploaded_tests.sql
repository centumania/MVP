-- =============================================================================
-- Migration 031: uploaded_tests table
--
-- Admin pre-uploads a full daily test as JSON. When a published uploaded test
-- exists for today, the daily-test API serves it to ALL students (same fixed
-- set), taking priority over the personalised html_question_bank flow.
--
-- questions jsonb shape (validated by the API on upload):
--   [{ "question": text, "options": [a,b,c,d], "correct": 0-3,
--      "explanation": text|null, "topic": text }]
--
-- Idempotent: uses IF NOT EXISTS throughout.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.uploaded_tests (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  test_date      date        NOT NULL,
  title          text        NOT NULL DEFAULT 'Daily Test',
  questions      jsonb       NOT NULL,
  question_count integer     NOT NULL,
  is_published   boolean     NOT NULL DEFAULT true,
  created_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uploaded_tests_pkey      PRIMARY KEY (id),
  CONSTRAINT uploaded_tests_date_uniq UNIQUE (test_date),
  CONSTRAINT uploaded_tests_count_chk CHECK (question_count > 0)
);

COMMENT ON TABLE public.uploaded_tests IS
  'Admin pre-uploaded daily tests (JSON). Takes priority over AI-generated '
  'assignments in /api/study/daily-test/questions when published for today.';

CREATE INDEX IF NOT EXISTS idx_uploaded_tests_date
  ON public.uploaded_tests (test_date) WHERE is_published;

-- ── RLS: admin-only writes; students never read this table directly ──────────
-- (questions are served through the API with correct answers stripped)

ALTER TABLE public.uploaded_tests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'uploaded_tests'
      AND policyname = 'uploaded_tests_admin_full_access'
  ) THEN
    CREATE POLICY "uploaded_tests_admin_full_access"
      ON public.uploaded_tests FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;
