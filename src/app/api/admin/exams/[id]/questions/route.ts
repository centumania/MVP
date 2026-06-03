/**
 * GET  /api/admin/exams/[id]/questions — list questions for an exam
 * POST /api/admin/exams/[id]/questions — bulk insert questions (replace all)
 *
 * POST body: { questions: Question[], mode: 'append' | 'replace' }
 * Each question: { question_text, option_a, option_b, option_c, option_d,
 *                  correct_answer, explanation?, marks?, sort_order? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { AnswerOption } from '@/src/types/database'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const VALID_OPTIONS = new Set<string>(['A', 'B', 'C', 'D'])

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, sort_order')
    .eq('exam_id', id)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  return NextResponse.json({ questions: questions ?? [] })
}

export async function POST(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id: examId } = await params
  const supabase = getSupabaseAdminClient()

  // Verify exam exists
  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  }

  let body: { questions?: unknown[]; mode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { questions: raw = [], mode = 'replace' } = body

  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'questions array is required' }, { status: 400 })
  }

  // Validate each question
  const validated = []
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as Record<string, unknown>
    if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      return NextResponse.json({ error: `Question ${i + 1}: missing required text/option fields` }, { status: 400 })
    }
    if (!VALID_OPTIONS.has(String(q.correct_answer ?? ''))) {
      return NextResponse.json({ error: `Question ${i + 1}: correct_answer must be A, B, C, or D` }, { status: 400 })
    }
    validated.push({
      exam_id:        examId,
      question_text:  String(q.question_text).trim(),
      option_a:       String(q.option_a).trim(),
      option_b:       String(q.option_b).trim(),
      option_c:       String(q.option_c).trim(),
      option_d:       String(q.option_d).trim(),
      correct_answer: String(q.correct_answer) as AnswerOption,
      explanation:    q.explanation ? String(q.explanation).trim() : null,
      marks:          Number(q.marks ?? 1),
      sort_order:     Number(q.sort_order ?? i),
    })
  }

  // Replace mode: delete existing first
  if (mode === 'replace') {
    const { error: delError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_id', examId)

    if (delError) {
      return NextResponse.json({ error: 'Failed to clear existing questions' }, { status: 500 })
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('questions')
    .insert(validated)
    .select('id')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ inserted: inserted?.length ?? 0 }, { status: 201 })
}
