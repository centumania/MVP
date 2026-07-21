-- 031: UNIQUE (batch_id, test_date) on daily_tests.
--
-- Root-cause fix for silent daily-test persistence failure (found 2026-07-21):
-- the grade/questions routes upsert daily_tests with
-- onConflict: 'batch_id,test_date'. Without this unique constraint Postgres
-- rejects the upsert (42P10), the code treated the null result as "no test"
-- and silently skipped writing test_submissions / test_submission_answers /
-- topic accuracy / Centum attendance. DEV already has this constraint
-- (daily_tests_batch_id_test_date_key via migration 007); PROD was missing it
-- due to sparse SQL-editor migration history. daily_tests is empty in prod,
-- so adding it is metadata-only and instant.
--
-- Idempotent: safe to run on both DEV (no-op) and PROD (adds constraint).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.daily_tests'::regclass
      AND conname  = 'daily_tests_batch_id_test_date_key'
  ) THEN
    ALTER TABLE public.daily_tests
      ADD CONSTRAINT daily_tests_batch_id_test_date_key UNIQUE (batch_id, test_date);
  END IF;
END $$;
