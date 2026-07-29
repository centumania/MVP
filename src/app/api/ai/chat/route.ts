/**
 * POST /api/ai/chat — the study companion behind the floating chat widget.
 *
 * Streams a reply so the student sees words appear instead of waiting on a
 * spinner; a long explanation would otherwise sit silent for many seconds.
 *
 * Auth: valid JWT. Day-1 students may ask a limited number of questions so the
 * assistant is something they can actually try before paying; beyond that it
 * requires payment_verified, mirroring the rest of the platform's gating.
 *
 * The API key is read from the environment and never reaches the browser —
 * the client talks only to this route.
 */
import { NextRequest }              from 'next/server'
import Anthropic                    from '@anthropic-ai/sdk'
import { getSupabaseAdminClient }   from '@/src/lib/supabase/server'
import { rateLimit }                from '@/src/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Free students get a taste of the assistant before the paywall. */
const FREE_MESSAGES_PER_DAY = 5
/** Kept short: this is a study companion, not an essay generator. */
const MAX_TOKENS = 1200
/** Guards against a runaway client sending unbounded history. */
const MAX_HISTORY_TURNS = 12

const SYSTEM_PROMPT = `You are the CentuMania study companion, helping Indian students prepare for government exams (SSC, RRB, Banking, and Tamil Nadu state exams).

How to answer:
- Answer the actual question first, then explain the reasoning. Students are usually mid-revision and need the point, not a preamble.
- Be concrete. Give the formula, the date, the article number, the rule — then one short example.
- Keep it tight. A few sentences for a factual question; a short numbered list for a multi-step method.
- Use simple English. Many students are studying in their second language. Tamil is welcome if the student writes in Tamil.
- For quantitative questions, show the working line by line so the method transfers to similar questions.
- When something is a classic exam trap or a frequently repeated question, say so — that is what makes it worth remembering.

Boundaries:
- If you are not certain of a fact, say so plainly rather than inventing a date, figure, or article number. A confident wrong answer costs a student marks.
- Stay on exam preparation. If asked something unrelated, redirect briefly and warmly.
- Never claim to know the student's scores or history beyond the context provided below.`

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user cap: the upstream model call costs real money on every request.
  const limiter = await rateLimit(`ai-chat:${user.id}`, { limit: 30, window: '10 m' })
  if (!limiter.success) {
    return Response.json(
      { error: 'You are sending messages very quickly. Give it a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limiter.reset - Date.now()) / 1000)) } },
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_verified, name')
    .eq('id', user.id)
    .single()

  const paid = profile?.payment_verified === true

  // Free students get a daily allowance rather than a hard wall, so the
  // feature is genuinely try-before-you-buy.
  if (!paid) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_chat_message')
      .gte('created_at', since)

    if ((count ?? 0) >= FREE_MESSAGES_PER_DAY) {
      return Response.json({
        error: 'limit_reached',
        message: `You've used your ${FREE_MESSAGES_PER_DAY} free questions for today. Unlock unlimited answers with your full programme.`,
      }, { status: 402 })
    }
  }

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, history } = body as {
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }
  if (message.length > 4000) {
    return Response.json({ error: 'That message is too long — please shorten it.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Deliberately vague to the student, explicit in the logs.
    console.error('[ai/chat] ANTHROPIC_API_KEY is not configured')
    return Response.json({ error: 'The study companion is not available right now.' }, { status: 503 })
  }

  // Only the last few turns are replayed: enough for follow-ups like "and the
  // next one?" without resending an entire session on every keystroke.
  const priorTurns = (Array.isArray(history) ? history : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS)
    .map(m => ({ role: m.role, content: m.content }))

  const firstName = (profile?.name ?? '').split(' ')[0]
  const studentContext = firstName
    ? `The student's name is ${firstName}. Address them by name occasionally, not in every message.`
    : ''

  const anthropic = new Anthropic({ apiKey })

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-5',
      max_tokens: MAX_TOKENS,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        ...(studentContext ? [{ type: 'text' as const, text: studentContext }] : []),
      ],
      messages: [...priorTurns, { role: 'user', content: message }],
    })

    // Record the message for the free-tier counter and the engagement stream.
    // Best-effort: a analytics failure must never cost the student their answer.
    supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'ai_chat_message',
      session_id: `ai-chat-${user.id}`,
      event_timestamp: new Date().toISOString(),
      metadata: { material_id: 'ai-assistant', paid },
    }).then(undefined, () => {})

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          console.error('[ai/chat] stream failed:', err)
          controller.enqueue(encoder.encode('\n\n(Sorry — that answer was cut short. Please ask again.)'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[ai/chat] request failed:', err)
    return Response.json({ error: 'The study companion could not answer just now. Please try again.' }, { status: 502 })
  }
}
