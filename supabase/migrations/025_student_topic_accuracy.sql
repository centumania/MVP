-- =============================================================================
-- Migration 025: student_topic_accuracy table
--
-- Tracks per-student, per-topic accuracy across Centum Index daily tests.
-- Computed accuracy = ROUND((total_correct::numeric / total_attempted) * 100, 2)
-- This is calculated on read — NOT stored as a generated column — so the
-- upsert pattern in update_topic_accuracy_after_submission (migration 026)
-- can freely increment total_attempted and total_correct without conflict.
--
-- Idempotent: uses IF NOT EXISTS throughout.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_topic_accuracy (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic           text        NOT NULL,
  total_attempted integer     NOT NULL DEFAULT 0,
  total_correct   integer     NOT NULL DEFAULT 0,
  last_updated    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sta_pkey             PRIMARY KEY (id),
  CONSTRAINT sta_accuracy_check   CHECK (total_correct <= total_attempted),
  CONSTRAINT sta_user_topic_uniq  UNIQUE (user_id, topic)
);

COMMENT ON TABLE public.student_topic_accuracy IS
  'Per-student, per-topic running totals. '
  'Upserted by update_topic_accuracy_after_submission() after each daily test. '
  'accuracy_pct is computed on read: ROUND((correct/attempted)*100, 2).';

CREATE INDEX IF NOT EXISTS idx_sta_user_id ON public.student_topic_accuracy (user_id);
CREATE INDEX IF NOT EXISTS idx_sta_topic   ON public.student_topic_accuracy (topic);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.student_topic_accuracy ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'student_topic_accuracy'
      AND policyname = 'sta_student_reads_own'
  ) THEN
    CREATE POLICY "sta_student_reads_own"
      ON public.student_topic_accuracy FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'student_topic_accuracy'
      AND policyname = 'sta_admin_full_access'
  ) THEN
    CREATE POLICY "sta_admin_full_access"
      ON public.student_topic_accuracy FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;
