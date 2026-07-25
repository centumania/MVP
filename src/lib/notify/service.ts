/**
 * Notification orchestrator.
 *
 * One entry point for "message this student": checks contact + consent, writes
 * a ledger row (queued), sends via the provider, updates the row (sent/failed/
 * skipped). Uses the service-role Supabase client. Never throws — returns a
 * result the caller (admin action or cron) can surface.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendWhatsApp } from './twilio'

export type NotifyStatus = 'sent' | 'failed' | 'skipped'
export interface NotifyResult {
  status: NotifyStatus
  detail: string
  sid?: string
  notificationId?: string
}

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

async function insertLedger(
  db: SupabaseClient,
  opts: NotifyWhatsAppOpts,
  status: NotifyStatus | 'queued',
  error?: string,
): Promise<string | undefined> {
  const { data } = await db
    .from('notifications')
    .insert({
      user_id: opts.userId,
      channel: 'whatsapp',
      template_key: opts.templateKey ?? null,
      status,
      body: opts.body ?? (opts.contentSid ? `template:${opts.contentSid}` : null),
      created_by: opts.createdBy ?? null,
      error: error ?? null,
    })
    .select('id')
    .single()
  return data?.id as string | undefined
}

export async function notifyWhatsApp(db: SupabaseClient, opts: NotifyWhatsAppOpts): Promise<NotifyResult> {
  const { data: p } = await db
    .from('profiles')
    .select('phone, whatsapp_opt_in, name')
    .eq('id', opts.userId)
    .single()

  if (!p?.phone) return { status: 'skipped', detail: 'No phone number on file' }

  const requireOptIn = opts.requireOptIn !== false
  if (requireOptIn && p.whatsapp_opt_in !== true) {
    const id = await insertLedger(db, opts, 'skipped', 'No WhatsApp opt-in')
    return { status: 'skipped', detail: 'Student has not opted in to WhatsApp', notificationId: id }
  }

  const notifId = await insertLedger(db, opts, 'queued')
  const result = await sendWhatsApp({
    to: p.phone as string,
    body: opts.body,
    contentSid: opts.contentSid,
    contentVariables: opts.contentVariables,
  })

  if (result.ok) {
    if (notifId) {
      await db.from('notifications')
        .update({ status: 'sent', provider_sid: result.sid, sent_at: new Date().toISOString() })
        .eq('id', notifId)
    }
    return { status: 'sent', detail: `Sent (${result.status})`, sid: result.sid, notificationId: notifId }
  }

  if (notifId) {
    await db.from('notifications').update({ status: 'failed', error: result.error }).eq('id', notifId)
  }
  const detail = result.code === 'not_configured'
    ? 'Twilio not configured yet — set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM'
    : result.error
  return { status: 'failed', detail, notificationId: notifId }
}
