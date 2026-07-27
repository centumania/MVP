/**
 * Email sender via Twilio SendGrid — REST API, no SDK dependency.
 *
 * Env (secrets, never in code):
 *   SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (a verified sender), SENDGRID_FROM_NAME?
 *
 * Email is the ban-proof, approval-free channel — it works the moment the key is
 * set (no WhatsApp template/opt-in gymnastics). Never throws; returns
 * not_configured/error/ok so callers degrade gracefully.
 */
export type EmailResult =
  | { ok: true; status: number }
  | { ok: false; code: 'not_configured' | 'error'; error: string }

export interface EmailArgs {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(args: EmailArgs): Promise<EmailResult> {
  const key = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM_EMAIL
  if (!key || !from) {
    return { ok: false, code: 'not_configured', error: 'SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not set' }
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: args.to }] }],
        from: { email: from, name: process.env.SENDGRID_FROM_NAME ?? 'CentuMania' },
        subject: args.subject,
        content: [
          ...(args.text ? [{ type: 'text/plain', value: args.text }] : []),
          { type: 'text/html', value: args.html },
        ],
      }),
    })
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status }
    const body = await res.text().catch(() => '')
    return { ok: false, code: 'error', error: `SendGrid HTTP ${res.status} ${body.slice(0, 200)}` }
  } catch (e) {
    return { ok: false, code: 'error', error: e instanceof Error ? e.message : 'network error' }
  }
}
