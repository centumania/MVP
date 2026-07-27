/**
 * Notification orchestrator — one entry point per channel.
 *
 * Each send: check contact + consent → write a ledger row (queued) → send via the
 * provider → update the row (sent/failed/skipped). Uses the service-role Supabase
 * client. Never throws — returns a result the caller (admin action or cron) shows.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendWhatsApp } from './twilio'
import { sendEmail } from './sendgrid'

export type NotifyStatus = 'sent' | 'failed' | 'skipped'
export interface NotifyResult {
  status: NotifyStatus
  detail: string
  sid?: string
  notificationId?: string
}

interface LedgerRow {
  userId: string
  channel: 'whatsapp' | 'email'
  templateKey?: string
  body?: string | null
  createdBy?: string | null
}

async function insertLedger(
  db: SupabaseClient,
  row: LedgerRow,
  status: NotifyStatus | 'queued',
  error?: string,
): Promise<string | undefined> {
  const { data } = await db
    .from('notifications')
    .insert({
      user_id: row.userId,
      channel: row.channel,
      template_key: row.templateKey ?? null,
      status,
      body: row.body ?? null,
      created_by: row.createdBy ?? null,
      error: error ?? null,
    })
    .select('id')
    .single()
  return data?.id as string | undefined
}

// ── WhatsApp ────────────────────────────────────────────────────────────────

interface NotifyWhatsAppOpts {
  userId: string
  body?: string
  contentSid?: string
  contentVariables?: Record<string, string>
  templateKey?: string
  createdBy?: string | null
  /** Automated sends MUST require opt-in. Admin 1:1 support sends may pass false. */
  requireOptIn?: boolean
}

export async function notifyWhatsApp(db: SupabaseClient, opts: NotifyWhatsAppOpts): Promise<NotifyResult> {
  const { data: p } = await db.from('profiles').select('phone, whatsapp_opt_in, name').eq('id', opts.userId).single()
  if (!p?.phone) return { status: 'skipped', detail: 'No phone number on file' }

  const requireOptIn = opts.requireOptIn !== false
  const ledger: LedgerRow = {
    userId: opts.userId, channel: 'whatsapp', templateKey: opts.templateKey,
    body: opts.body ?? (opts.contentSid ? `template:${opts.contentSid}` : null), createdBy: opts.createdBy,
  }
  if (requireOptIn && p.whatsapp_opt_in !== true) {
    const id = await insertLedger(db, ledger, 'skipped', 'No WhatsApp opt-in')
    return { status: 'skipped', detail: 'Student has not opted in to WhatsApp', notificationId: id }
  }

  const notifId = await insertLedger(db, ledger, 'queued')
  const result = await sendWhatsApp({ to: p.phone as string, body: opts.body, contentSid: opts.contentSid, contentVariables: opts.contentVariables })

  if (result.ok) {
    if (notifId) await db.from('notifications').update({ status: 'sent', provider_sid: result.sid, sent_at: new Date().toISOString() }).eq('id', notifId)
    return { status: 'sent', detail: `Sent (${result.status})`, sid: result.sid, notificationId: notifId }
  }
  if (notifId) await db.from('notifications').update({ status: 'failed', error: result.error }).eq('id', notifId)
  const detail = result.code === 'not_configured'
    ? 'Twilio not configured yet — set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM'
    : result.error
  return { status: 'failed', detail, notificationId: notifId }
}

// ── Email ───────────────────────────────────────────────────────────────────

interface NotifyEmailOpts {
  userId: string
  subject: string
  html: string
  text?: string
  templateKey?: string
  createdBy?: string | null
  requireOptIn?: boolean
}

export async function notifyEmail(db: SupabaseClient, opts: NotifyEmailOpts): Promise<NotifyResult> {
  const { data: p } = await db.from('profiles').select('email, email_opt_in, name').eq('id', opts.userId).single()
  if (!p?.email) return { status: 'skipped', detail: 'No email on file' }

  const requireOptIn = opts.requireOptIn !== false
  const ledger: LedgerRow = { userId: opts.userId, channel: 'email', templateKey: opts.templateKey, body: opts.subject, createdBy: opts.createdBy }
  if (requireOptIn && p.email_opt_in === false) {
    const id = await insertLedger(db, ledger, 'skipped', 'Email opt-out')
    return { status: 'skipped', detail: 'Student opted out of email', notificationId: id }
  }

  const notifId = await insertLedger(db, ledger, 'queued')
  const result = await sendEmail({ to: p.email as string, subject: opts.subject, html: opts.html, text: opts.text })

  if (result.ok) {
    if (notifId) await db.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', notifId)
    return { status: 'sent', detail: `Sent (HTTP ${result.status})`, notificationId: notifId }
  }
  if (notifId) await db.from('notifications').update({ status: 'failed', error: result.error }).eq('id', notifId)
  const detail = result.code === 'not_configured'
    ? 'SendGrid not configured yet — set SENDGRID_API_KEY / SENDGRID_FROM_EMAIL'
    : result.error
  return { status: 'failed', detail, notificationId: notifId }
}
