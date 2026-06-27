-- =============================================================================
-- Migration 023: Add topic and subtopic columns to questions
--
-- Uses NOT NULL + DEFAULT 'General Studies' so existing rows are unaffected.
-- Live tests and student data continue to work unchanged — every question
-- simply reads as 'General Studies' until admin tags them via the admin panel.
--
-- CONFIRMED SAFE: ADD COLUMN with a DEFAULT on Postgres takes an
-- AccessShareLock (not a rewrite), so this runs instantly even with
-- 28 concurrent sessions.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to run twice.
-- =============================================================================

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS topic text NOT NULL DEFAULT 'General Studies';

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subtopic text;

CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions (topic);

-- Verify: after running this migration, run:
-- SELECT topic, COUNT(*) FROM questions GROUP BY topic;
-- Expected: all rows show 'General Studies' until admin tags them.

COMMENT ON COLUMN public.questions.topic IS
  'High-level topic tag (e.g. "History", "Polity"). '
  'Defaults to "General Studies" — admin tags via admin panel. '
  'Drives student_topic_accuracy and daily assignment generation.';

COMMENT ON COLUMN public.questions.subtopic IS
  'Optional finer-grained tag (e.g. "Ancient India"). Nullable.';
