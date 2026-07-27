/**
 * Onboarding welcome — the first message a new student gets.
 * Email is transactional (they just created the account, so it doesn't require
 * marketing opt-in); the WhatsApp welcome only fires if they opted in.
 * Best-effort: never throws, so it can't affect the registration response.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyEmail, notifyWhatsApp } from './service'

const APP_URL = 'https://centumania.co.in'

function welcomeHtml(first: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FAFAF8;font-family:Inter,Arial,sans-serif;color:#111827">
  <div style="max-width:520px;margin:0 auto;padding:28px 22px">
    <p style="font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 4px">CentuMania</p>
    <p style="font-size:12px;color:#6B7280;margin:0 0 22px">Winning is a habit.</p>
    <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:24px">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 10px">Welcome, ${first} 🎯</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 14px">
        You're in. Here's the whole plan in one line: <b>study a little every day, take the daily test, and watch your Centum Index climb.</b> Consistency is the entire game.
      </p>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px">
        Start with <b>Day 1</b> — it's free. Open a module, take today's test, and you'll see your rank move.
      </p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px">Start Day 1 →</a>
    </div>
    <p style="font-size:11.5px;color:#9CA3AF;margin:18px 0 0;line-height:1.6">
      Need help? Reply to this email or message us on WhatsApp. — Team CentuMania
    </p>
  </div></body></html>`
}

export async function sendWelcome(db: SupabaseClient, opts: { userId: string; name: string }): Promise<void> {
  const first = (opts.name?.split(' ')[0] || 'there').trim()
  try {
    await notifyEmail(db, {
      userId: opts.userId,
      subject: `Welcome to CentuMania, ${first} 🎯`,
      html: welcomeHtml(first),
      text: `Welcome, ${first}! You're in. Study a little every day, take the daily test, and watch your Centum Index climb. Start Day 1 (free): ${APP_URL}/dashboard`,
      templateKey: 'welcome',
      requireOptIn: false, // transactional welcome for a just-created account
    })
  } catch { /* best-effort */ }
  try {
    await notifyWhatsApp(db, {
      userId: opts.userId,
      body: `Hi ${first}! 👋 Welcome to CentuMania. Your Day-1 study + daily test are ready and free — ${APP_URL}/dashboard . Winning is a habit 🎯`,
      templateKey: 'welcome',
      requireOptIn: true, // only if they opted in to WhatsApp
    })
  } catch { /* best-effort */ }
}
