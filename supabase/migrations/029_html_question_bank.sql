-- =============================================================================
-- Migration 029: html_question_bank + daily_test_assignments enhancement
--
-- html_question_bank: MCQs extracted from /public/study/*.html files.
--   These are "trap" questions surfaced in daily tests alongside formal exam MCQs.
--   Populated by scripts/extract-html-questions.mjs (run once per new HTML file).
--
-- daily_test_assignments.html_question_ids: new column to store the HTML bank
--   question IDs assigned per student per day (separate from exam question_ids).
--
-- html_question_accuracy: per-student per-question running accuracy for HTML MCQs,
--   updated after each daily test grading.
--
-- Idempotent: IF NOT EXISTS guards on all DDL.
-- =============================================================================

-- ── 1. HTML question bank ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.html_question_bank (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  source_file     text        NOT NULL,
  node_title      text,
  question_text   text        NOT NULL,
  option_a        text        NOT NULL,
  option_b        text        NOT NULL,
  option_c        text        NOT NULL,
  option_d        text        NOT NULL,
  correct_option  smallint    NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
  explanation     text,
  topic           text        NOT NULL DEFAULT 'General Studies',
  is_trap         boolean     NOT NULL DEFAULT false,
  extracted_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT html_question_bank_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.html_question_bank IS
  'MCQs extracted from /public/study/*.html files. '
  'correct_option is 0-based (0=A,1=B,2=C,3=D). '
  'Populated by scripts/extract-html-questions.mjs.';

CREATE INDEX IF NOT EXISTS idx_hqb_topic      ON public.html_question_bank (topic);
CREATE INDEX IF NOT EXISTS idx_hqb_source     ON public.html_question_bank (source_file);
CREATE INDEX IF NOT EXISTS idx_hqb_is_trap    ON public.html_question_bank (is_trap);

-- RLS
ALTER TABLE public.html_question_bank ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='html_question_bank' AND policyname='hqb_authenticated_read'
  ) THEN
    CREATE POLICY "hqb_authenticated_read"
      ON public.html_question_bank FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='html_question_bank' AND policyname='hqb_admin_full_access'
  ) THEN
    CREATE POLICY "hqb_admin_full_access"
      ON public.html_question_bank FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;

-- ── 2. Add html_question_ids column to daily_test_assignments ─────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='daily_test_assignments'
      AND column_name='html_question_ids'
  ) THEN
    ALTER TABLE public.daily_test_assignments
      ADD COLUMN html_question_ids uuid[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

COMMENT ON COLUMN public.daily_test_assignments.html_question_ids IS
  'HTML question bank IDs assigned to this student for this day. '
  'Separate from question_ids (formal exam questions).';

-- ── 3. HTML question accuracy (per-student running totals) ────────────────────

CREATE TABLE IF NOT EXISTS public.html_question_accuracy (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  html_question_id uuid        NOT NULL REFERENCES public.html_question_bank(id) ON DELETE CASCADE,
  total_attempted  integer     NOT NULL DEFAULT 0,
  total_correct    integer     NOT NULL DEFAULT 0,
  last_updated     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT html_question_accuracy_pkey          PRIMARY KEY (id),
  CONSTRAINT html_question_accuracy_user_q_uniq   UNIQUE (user_id, html_question_id),
  CONSTRAINT html_question_accuracy_totals_check  CHECK (total_correct <= total_attempted AND total_attempted >= 0)
);

COMMENT ON TABLE public.html_question_accuracy IS
  'Per-student per-HTML-question accuracy. '
  'Updated by /api/study/daily-test/grade after each submission. '
  'Used by generate-daily-assignments to boost weak HTML questions.';

CREATE INDEX IF NOT EXISTS idx_hqa_user_id ON public.html_question_accuracy (user_id);
CREATE INDEX IF NOT EXISTS idx_hqa_html_q  ON public.html_question_accuracy (html_question_id);

ALTER TABLE public.html_question_accuracy ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='html_question_accuracy' AND policyname='hqa_student_reads_own'
  ) THEN
    CREATE POLICY "hqa_student_reads_own"
      ON public.html_question_accuracy FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='html_question_accuracy' AND policyname='hqa_admin_full_access'
  ) THEN
    CREATE POLICY "hqa_admin_full_access"
      ON public.html_question_accuracy FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;

-- ── 4. Upsert helper for html_question_accuracy ───────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_html_question_accuracy(
  p_user_id          uuid,
  p_html_question_id uuid,
  p_correct          boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.html_question_accuracy
    (user_id, html_question_id, total_attempted, total_correct, last_updated)
  VALUES
    (p_user_id, p_html_question_id,
     1,
     CASE WHEN p_correct THEN 1 ELSE 0 END,
     now())
  ON CONFLICT (user_id, html_question_id) DO UPDATE
    SET total_attempted = html_question_accuracy.total_attempted + 1,
        total_correct   = html_question_accuracy.total_correct + CASE WHEN p_correct THEN 1 ELSE 0 END,
        last_updated    = now();
END;
$$;

COMMENT ON FUNCTION public.upsert_html_question_accuracy IS
  'Atomically increments per-student per-HTML-question accuracy counters. '
  'Called by /api/study/daily-test/grade after each submission.';
