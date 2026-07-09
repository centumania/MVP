/**
 * /api/admin/upload-test
 *
 * GET  — list uploaded tests (most recent first)
 * POST — create/replace an uploaded test for a date
 *        Body: { testDate: 'YYYY-MM-DD', title?: string, questions: UploadedQuestion[] }
 * DELETE — remove an uploaded test: ?id=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { validateQuestions } from '@/src/lib/uploaded-test'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('uploaded_tests')
    .select('id, test_date, title, question_count, is_published, created_at')
    .order('test_date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tests: data ?? [] })
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { testDate, title, questions: rawQuestions } = body as {
    testDate?: string; title?: string; questions?: unknown
  }

  if (!testDate || !/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
    return NextResponse.json({ error: 'testDate must be YYYY-MM-DD' }, { status: 400 })
  }

  const result = validateQuestions(rawQuestions)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('uploaded_tests')
    .upsert(
      {
        test_date:      testDate,
        title:          title?.trim() || 'Daily Test',
        questions:      result.questions,
        question_count: result.questions.length,
        is_published:   true,
        created_by:     ctx.userId,
        updated_at:     new Date().toISOString(),
      },
      { onConflict: 'test_date' },
    )
    .select('id, test_date, title, question_count')
    .single()

  if (error) {
    console.error('[admin/upload-test] upsert failed:', error)
    return NextResponse.json({ error: 'Failed to save test' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, test: data })
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from('uploaded_tests').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
