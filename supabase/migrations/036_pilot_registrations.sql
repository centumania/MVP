-- =============================================================================
-- Migration 036: pilot_registrations — Vijayadashami pilot orientation sign-ups
--
-- Public /pilot page → POST /api/pilot/register → this table. Holds a name and
-- a phone number, so it is service-role only: RLS on with NO policies, never
-- readable or writable through the public REST API (same posture as
-- onboarding_leads). Admins read it from the Supabase dashboard / SQL.
--
-- One row per phone number: a repeat submission updates the existing row
-- (upsert on phone) instead of creating a duplicate follow-up.
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pilot_registrations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  phone       text        NOT NULL UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),
  exam        text        NOT NULL,
  stage       text        NOT NULL,
  source      text,
  lang        text        NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'ta')),
  status      text        NOT NULL DEFAULT 'registered'
                          CHECK (status IN ('registered', 'confirmed', 'attended', 'enrolled', 'declined')),
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pilot_registrations_created_at_idx
  ON public.pilot_registrations (created_at DESC);

ALTER TABLE public.pilot_registrations ENABLE ROW LEVEL SECURITY;
