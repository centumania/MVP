/**
 * POST /api/ai/module-chat — the strictly-scoped "ask about this lesson" box.
 *
 * Unlike /api/ai/chat (the general study companion, free to reason from its
 * own knowledge), this route answers ONLY from the specific lesson's own
 * written material. The founder's explicit requirement: "it should not guess
 * anything, it should give correct, perfect answers" — so when the lesson's
 * notes don't cover something, the model is instructed to say so plainly
 * rather than fill the gap from general knowledge. Low temperature, no room
 * for creative interpretation.
 *
 * Auth, rate-limiting and the free-tier daily allowance mirror /api/ai/chat
 * exactly, and share the same `ai_chat_message` analytics event / counter —
 * one combined daily allowance across both assistants, not two separate ones.
 */
import { NextRequest }              from 'next/server'
import Anthropic                    from '@anthropic-ai/sdk'
import { getSupabaseAdminClient }   from '@/src/lib/supabase/server'
import { rateLimit }                from '@/src/lib/rate-limit'
import { getLessonById }            from '@/src/data/classroom'

export const dynamic = 'force-dynamic'

const FREE_MESSAGES_PER_DAY = 5
const MAX_TOKENS = 700
const MAX_HISTORY_TURNS = 8

function systemPromptFor(title: string, explanation: string): string {
  return `You are a strict study assistant for one specific CentuMania lesson: "${title}".

You may ONLY use the material below to answer. This is a hard rule, not a guideline.

LESSON MATERIAL:
${explanation}

Rules:
- If the answer is contained in the material above, answer directly and concretely — quote the relevant fact, rule or figure.
- If the question asks about something the material above does NOT cover, say so plainly: "This isn't covered in this lesson's notes — I don't want to guess and risk giving you a wrong answer for your exam." Do not fill the gap from general knowledge, even if you believe you know the answer.
- Never invent a date, figure, article number or fact that is not present in the material above.
- Keep answers short and exam-focused — a few sentences, not an essay.
- Tamil is welcome if the student writes in Tamil.`
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = await rateLimit(`ai-module-chat:${user.id}`, { limit: 30, window: '10 m' })
  if (!limiter.success) {
    return Response.json(
      { error: 'You are sending messages very quickly. Give it a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limiter.reset - Date.now()) / 1000)) } },
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { moduleId, message, history } = body as {
    moduleId?: string
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
  }

  if (typeof moduleId !== 'string' || !moduleId) {
    return Response.json({ error: 'moduleId is required' }, { status: 400 })
  }
  if (typeof message !== 'string' || message.trim().length === 0) {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }
  if (message.length > 2000) {
    return Response.json({ error: 'That message is too long — please shorten it.' }, { status: 400 })
  }

  const found = getLessonById(moduleId)
  if (!found || !found.lesson.explanation) {
    return Response.json({
      error: 'not_available',
      message: 'There are no written notes for this module yet, so the assistant can\'t answer from it safely.',
    }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_verified')
    .eq('id', user.id)
    .single()

  const paid = profile?.payment_verified === true

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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[ai/module-chat] ANTHROPIC_API_KEY is not configured')
    return Response.json({ error: 'The study companion is not available right now.' }, { status: 503 })
  }

  const priorTurns = (Array.isArray(history) ? history : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS)
    .map(m => ({ role: m.role, content: m.content }))

  const anthropic = new Anthropic({ apiKey })

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-5',
      max_tokens: MAX_TOKENS,
      temperature: 0.1,
      system: [
        { type: 'text', text: systemPromptFor(found.lesson.title, found.lesson.explanation), cache_control: { type: 'ephemeral' } },
      ],
      messages: [...priorTurns, { role: 'user', content: message }],
    })

    // Same counter/event as the general assistant — one shared daily allowance.
    supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'ai_chat_message',
      session_id: `ai-module-chat-${user.id}`,
      event_timestamp: new Date().toISOString(),
      metadata: { material_id: moduleId, paid, scope: 'module' },
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
          console.error('[ai/module-chat] stream failed:', err)
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
    console.error('[ai/module-chat] request failed:', err)
    return Response.json({ error: 'The study companion could not answer just now. Please try again.' }, { status: 502 })
  }
}
