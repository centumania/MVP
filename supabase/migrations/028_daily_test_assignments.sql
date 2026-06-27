-- =============================================================================
-- Migration 028: daily_test_assignments table
--
-- Stores pre-generated, per-student question lists for the next day's test.
-- Generated nightly at 23:30 IST by the generate-daily-assignments Edge Function.
-- topic_weights records the tier classification used, for debugging.
--
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS, policies inside DO blocks.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_test_assignments (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_date     date        NOT NULL,
  question_ids  uuid[]      NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  topic_weights jsonb,

  CONSTRAINT daily_test_assignments_pkey           PRIMARY KEY (id),
  CONSTRAINT daily_test_assignments_user_date_uniq UNIQUE (user_id, test_date)
);

COMMENT ON TABLE public.daily_test_assignments IS
  'Pre-generated question assignments per student per day. '
  'Produced by generate-daily-assignments Edge Function at 23:30 IST. '
  'topic_weights stores the tier breakdown used (debug/audit trail).';

CREATE INDEX IF NOT EXISTS idx_dta_user_id   ON public.daily_test_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_dta_test_date ON public.daily_test_assignments (test_date);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.daily_test_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'daily_test_assignments'
      AND policyname = 'dta_student_reads_own'
  ) THEN
    CREATE POLICY "dta_student_reads_own"
      ON public.daily_test_assignments FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'daily_test_assignments'
      AND policyname = 'dta_admin_full_access'
  ) THEN
    CREATE POLICY "dta_admin_full_access"
      ON public.daily_test_assignments FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;
