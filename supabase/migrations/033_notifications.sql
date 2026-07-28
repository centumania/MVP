-- 031: Notification engine foundation — opt-in consent + a send ledger.
--
-- Additive and safe. Powers automated WhatsApp/email reminders (via Twilio).
-- Nothing here sends anything; it stores consent and records every attempt.

-- Consent columns on profiles. WhatsApp + India TRAI require explicit opt-in
-- for commercial messages; email defaults on (transactional/service email).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_in    boolean NOT NULL DEFAULT true;

-- Every message we attempt is recorded here: traceability, de-dupe, status,
-- and the audit trail of who was contacted when and why.
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('whatsapp','email','sms')),
  template_key text,                         -- logical message name, e.g. 'at_risk_nudge'
  status       text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  provider_sid text,                         -- Twilio message SID
  error        text,
  body         text,                         -- rendered text (or template ref)
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by   uuid,                         -- admin who triggered; null for automated
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz
);
CREATE INDEX IF NOT EXISTS notifications_user_idx   ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON public.notifications(status, created_at DESC);

-- Service-role only (admin client / cron). RLS on with no anon/user policies
-- = locked by default; students never read the notification ledger.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
