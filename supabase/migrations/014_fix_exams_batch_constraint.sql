-- =============================================================================
-- Migration: 014_fix_exams_batch_constraint.sql
--
-- FIX C-1: exams table had UNIQUE(day_number) globally — would prevent creating
-- Day 1-25 for any second cohort batch with a "duplicate key" error.
--
-- Replace with UNIQUE(batch_id, day_number) so each batch has its own namespace.
-- Also relax the day_number range CHECK from "between 1 and 25" to ">= 1" so
-- batches with total_days > 25 can have exams for those extra days.
-- =============================================================================

-- Drop the global unique constraint on day_number
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_day_number_key;

-- Drop the hardcoded range check (1-25)
ALTER TABLE public.exams
  DROP CONSTRAINT IF EXISTS exams_day_number_range;

-- Add per-batch unique constraint so each batch can have Day 1-N independently
ALTER TABLE public.exams
  ADD CONSTRAINT exams_batch_day_unique UNIQUE (batch_id, day_number);

-- Add a simple positive-number check (no artificial upper bound)
ALTER TABLE public.exams
  ADD CONSTRAINT exams_day_number_positive CHECK (day_number >= 1);

COMMENT ON CONSTRAINT exams_batch_day_unique ON public.exams IS
  'Each batch has its own day_number namespace. Replaces the old global UNIQUE(day_number).';
