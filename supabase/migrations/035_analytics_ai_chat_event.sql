-- =============================================================================
-- Migration 035: allow the 'ai_chat_message' analytics event
--
-- analytics_events.event_name is constrained to a fixed allowlist. The AI study
-- companion records one row per question asked, and that row is what the
-- free-tier daily allowance is counted from — with the event name missing from
-- the allowlist the INSERT fails, the count reads 0 forever, and unpaid
-- students get unlimited answers from a metered upstream model.
--
-- Adds the event name to the CHECK constraint; every existing value is kept.
-- Idempotent: the constraint is only rebuilt when the new value is absent.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.analytics_events'::regclass
      AND conname  = 'analytics_events_name_check'
      AND pg_get_constraintdef(oid) LIKE '%ai_chat_message%'
  ) THEN
    ALTER TABLE public.analytics_events
      DROP CONSTRAINT IF EXISTS analytics_events_name_check;

    ALTER TABLE public.analytics_events
      ADD CONSTRAINT analytics_events_name_check CHECK (
        event_name = ANY (ARRAY[
          'login',
          'material_opened',
          'daily_material_completed',
          'node_opened',
          'node_completed',
          'mcq_started',
          'mcq_completed',
          'session_start',
          'session_end',
          'node_open',
          'tab_switch',
          'test_start',
          'answer',
          'test_finish',
          'ai_chat_message'
        ])
      );
  END IF;
END $$;
