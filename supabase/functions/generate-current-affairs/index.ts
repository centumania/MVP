/**
 * Supabase Edge Function: generate-current-affairs
 *
 * Calls Claude AI to generate 8 exam-relevant current affairs items for the day.
 * Triggered daily at 07:00 IST (01:30 UTC) via Vercel Cron →
 * /api/generate-current-affairs → this function.
 *
 * Each item has: title, summary (2-3 sentences, exam-focused), category,
 * exam_relevance (High/Medium/Low), tags.
 *
 * Categories: National, International, Economy, Environment, Science,
 *             Sports, Awards, State (Puducherry/TN)
 *
 * Deno runtime — imports from esm.sh.
 */

import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic           from 'https://esm.sh/@anthropic-ai/sdk@0.27'

const CATEGORIES = [
  'National', 'International', 'Economy', 'Environment',
  'Science', 'Sports', 'Awards', 'State',
]

const SYSTEM_PROMPT = `You are an expert content creator for Indian competitive exam preparation,
specifically for LDC/UDC (Lower Division Clerk / Upper Division Clerk) exams in Puducherry, Tamil Nadu.

Generate exactly 8 current affairs items that are:
1. Relevant to recent events (within the past 1-2 weeks conceptually)
2. Important for LDC/UDC exam preparation
3. Each from a different category where possible
4. Focused on: governance, economy, environment, science/tech, sports, awards/recognition, international relations, state-level news

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "title": "Short headline (max 10 words)",
    "summary": "2-3 sentences. State the fact clearly. Include key numbers/dates/names that examiners love. End with why it matters for exams.",
    "category": "National|International|Economy|Environment|Science|Sports|Awards|State",
    "exam_relevance": "High|Medium|Low",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

exam_relevance guide:
- High: facts with specific numbers, names, firsts, records — often directly asked
- Medium: policy/event context — asked in para completion or general knowledge
- Low: background context — useful for essay/general awareness

Keep summaries factual, concise, and memorable. Avoid vague language.`

Deno.serve(async (req) => {
  // Auth: caller must provide service role key or matching secret
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

  if (!supabaseUrl || !serviceKey || !anthropicKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  // ── 1. Generate current affairs via Claude ────────────────────────────────

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Kolkata',
  })

  let items: Array<{
    title: string
    summary: string
    category: string
    exam_relevance: string
    tags: string[]
  }>

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Today is ${dateStr}. Generate 8 current affairs items for LDC/UDC exam preparation. Focus on events and facts from the past 1-2 weeks that are most likely to appear in competitive exams. Include at least one item each about: Puducherry or Tamil Nadu, national governance, international affairs, and science/environment.`,
        },
      ],
      system: SYSTEM_PROMPT,
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    items = JSON.parse(jsonMatch[0])

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Empty items array')
    }

    // Validate and sanitize each item
    items = items.map(item => ({
      title:          String(item.title ?? '').slice(0, 200),
      summary:        String(item.summary ?? '').slice(0, 1000),
      category:       CATEGORIES.includes(item.category) ? item.category : 'National',
      exam_relevance: ['High', 'Medium', 'Low'].includes(item.exam_relevance)
        ? item.exam_relevance
        : 'Medium',
      tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 5) : [],
    })).filter(item => item.title && item.summary)

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'AI generation failed', detail: String(err) }),
      { status: 500 },
    )
  }

  // ── 2. Soft-delete today's existing items (regeneration) ─────────────────

  const todayDate = today.toISOString().slice(0, 10)

  await supabase
    .from('current_affairs')
    .update({ is_active: false })
    .eq('source_date', todayDate)

  // Also soft-delete items older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  await supabase
    .from('current_affairs')
    .update({ is_active: false })
    .lt('source_date', thirtyDaysAgo.toISOString().slice(0, 10))

  // ── 3. Insert new items ───────────────────────────────────────────────────

  const rows = items.map(item => ({
    ...item,
    source_date:  todayDate,
    generated_at: new Date().toISOString(),
    is_active:    true,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('current_affairs')
    .insert(rows)
    .select('id, title, category')

  if (insertError) {
    return new Response(
      JSON.stringify({ error: 'Insert failed', detail: insertError.message }),
      { status: 500 },
    )
  }

  return new Response(
    JSON.stringify({
      ok:          true,
      source_date: todayDate,
      generated:   inserted?.length ?? 0,
      items:       inserted?.map(i => ({ id: i.id, title: i.title, category: i.category })),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
