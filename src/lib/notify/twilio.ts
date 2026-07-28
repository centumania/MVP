/**
 * Twilio WhatsApp sender — via the REST API, no SDK dependency.
 *
 * Env (set in Vercel/Supabase secrets, never in code):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *   (FROM = whatsapp:+14155238886 for the sandbox, or your approved sender).
 *
 * Two modes (WhatsApp rules): `body` is FREE-FORM and only delivers within 24h
 * of the user's last inbound message; `contentSid` is an APPROVED TEMPLATE and
 * delivers anytime — that's what reminders/nudges to drifting students need.
 *
 * Never throws. If unconfigured, returns { ok:false, code:'not_configured' } so
 * callers degrade gracefully until the founder wires the Twilio account.
 */
export type TwilioSendResult =
  | { ok: true; sid: string; status: string }
  | { ok: false; code: 'not_configured' | 'error'; error: string }

export interface WhatsAppArgs {
  to: string                                  // E.164 or 10-digit Indian number
  body?: string                               // free-form (24h window only)
  contentSid?: string                         // approved template (anytime)
  contentVariables?: Record<string, string>
}

function toWhatsApp(num: string): string {
  const cleaned = num.replace(/[^\d+]/g, '')
  const e164 = cleaned.startsWith('+')
    ? cleaned
    : cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`
  return `whatsapp:${e164}`
}

export async function sendWhatsApp(args: WhatsAppArgs): Promise<TwilioSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) {
    return { ok: false, code: 'not_configured', error: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM not set' }
  }

  const form = new URLSearchParams()
  form.set('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`)
  form.set('To', toWhatsApp(args.to))
  if (args.contentSid) {
    form.set('ContentSid', args.contentSid)
    if (args.contentVariables) form.set('ContentVariables', JSON.stringify(args.contentVariables))
  } else if (args.body) {
    form.set('Body', args.body)
  } else {
    return { ok: false, code: 'error', error: 'Either body or contentSid is required' }
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
    const data = await res.json().catch(() => ({} as Record<string, unknown>))
    if (!res.ok) {
      const msg = (data as { message?: string }).message ?? `Twilio HTTP ${res.status}`
      return { ok: false, code: 'error', error: msg }
    }
    return { ok: true, sid: String((data as { sid?: string }).sid ?? ''), status: String((data as { status?: string }).status ?? 'queued') }
  } catch (e) {
    return { ok: false, code: 'error', error: e instanceof Error ? e.message : 'network error' }
  }
}
