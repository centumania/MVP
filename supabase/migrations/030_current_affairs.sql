-- =============================================================================
-- Migration 030: current_affairs table
--
-- Stores AI-generated exam-relevant current affairs items.
-- Generated daily at 07:00 IST by the generate-current-affairs Edge Function
-- (triggered by Vercel Cron → /api/generate-current-affairs → Edge Function).
--
-- Students see the current day's active items on their dashboard.
-- Items older than 30 days are automatically soft-deleted (is_active=false)
-- by a DB policy (done by the generation function on each run).
--
-- Idempotent: IF NOT EXISTS on all DDL.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.current_affairs (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  summary          text        NOT NULL,
  category         text        NOT NULL DEFAULT 'National',
  exam_relevance   text        NOT NULL DEFAULT 'Medium' CHECK (exam_relevance IN ('High','Medium','Low')),
  tags             text[]      NOT NULL DEFAULT '{}',
  source_date      date        NOT NULL DEFAULT current_date,
  generated_at     timestamptz NOT NULL DEFAULT now(),
  is_active        boolean     NOT NULL DEFAULT true,

  CONSTRAINT current_affairs_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.current_affairs IS
  'AI-generated exam-relevant current affairs. '
  'Generated daily by generate-current-affairs Edge Function via Vercel Cron. '
  'Categories: National, International, Economy, Environment, Science, Sports, Awards, State.';

CREATE INDEX IF NOT EXISTS idx_ca_source_date ON public.current_affairs (source_date DESC);
CREATE INDEX IF NOT EXISTS idx_ca_is_active   ON public.current_affairs (is_active, source_date DESC);
CREATE INDEX IF NOT EXISTS idx_ca_category    ON public.current_affairs (category);

-- RLS: students can read active current affairs; only service role/admin writes
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='current_affairs' AND policyname='ca_authenticated_read_active'
  ) THEN
    CREATE POLICY "ca_authenticated_read_active"
      ON public.current_affairs FOR SELECT TO authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='current_affairs' AND policyname='ca_admin_full_access'
  ) THEN
    CREATE POLICY "ca_admin_full_access"
      ON public.current_affairs FOR ALL TO authenticated
      USING (public.requesting_user_is_admin());
  END IF;
END $$;
