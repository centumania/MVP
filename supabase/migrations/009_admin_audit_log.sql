-- =============================================================================
-- Migration 009 — Admin Audit Log
--
-- Records every state-changing admin action. Provides forensic trail if an
-- admin account is compromised or actions are disputed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  admin_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  action      text        NOT NULL,   -- e.g. 'payment_verified', 'exam_created', 'student_deleted'
  target_id   uuid,                   -- ID of the affected resource (student, exam, material…)
  target_type text,                   -- 'profile' | 'exam' | 'material' | 'question' | etc.
  detail      jsonb,                  -- Optional extra context (before/after values, etc.)
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.admin_audit_log IS
  'Append-only log of admin actions. Never UPDATE or DELETE rows here.';

-- Index for admin-specific lookups and time-range queries
CREATE INDEX idx_audit_admin_id    ON public.admin_audit_log (admin_id);
CREATE INDEX idx_audit_created_at  ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_audit_target_id   ON public.admin_audit_log (target_id) WHERE target_id IS NOT NULL;

-- RLS: admins can read all rows; no-one can insert from client (server-side only via service role)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit: admins read all"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.requesting_user_is_admin());

-- No INSERT/UPDATE/DELETE policies — all writes via service role key from API routes only.
