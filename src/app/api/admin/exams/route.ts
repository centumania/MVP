/**
 * GET  /api/admin/exams — list all exams with question + submission counts
 * POST /api/admin/exams — create a new exam
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()

  const { data: batch } = await supabase
    .from('batches')
    .select('id')
    .eq('is_active', true)
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!batch) {
    return NextResponse.json({ exams: [], batchId: null })
  }

  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, day_number, title, exam_date, open_time, close_time, is_active, link_url')
    .eq('batch_id', batch.id)
    .order('day_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }

  const examIds = (exams ?? []).map(e => e.id)

  const [{ data: questionCounts }, { data: submissionCounts }] = await Promise.all([
    examIds.length > 0
      ? supabase.from('questions').select('exam_id').in('exam_id', examIds)
      : { data: [] },
    examIds.length > 0
      ? supabase.from('submissions').select('exam_id').in('exam_id', examIds)
      : { data: [] },
  ])

  const qMap: Record<string, number> = {}
  const sMap: Record<string, number> = {}
  for (const q of questionCounts ?? []) qMap[q.exam_id] = (qMap[q.exam_id] ?? 0) + 1
  for (const s of submissionCounts ?? []) sMap[s.exam_id] = (sMap[s.exam_id] ?? 0) + 1

  const enriched = (exams ?? []).map(e => ({
    ...e,
    linkUrl:         e.link_url,
    questionCount:   qMap[e.id] ?? 0,
    submissionCount: sMap[e.id] ?? 0,
  }))

  return NextResponse.json({ exams: enriched, batchId: batch.id })
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { batchId, dayNumber, title, examDate, openTime, closeTime, linkUrl } = body as Record<string, unknown>

  if (!batchId || !dayNumber || !title || !examDate || !openTime || !closeTime) {
    return NextResponse.json({ error: 'Missing required fields: batchId, dayNumber, title, examDate, openTime, closeTime' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exams')
    .insert({
      batch_id:    batchId as string,
      day_number:  Number(dayNumber),
      title:       String(title).trim(),
      description: null,
      exam_date:   String(examDate),
      open_time:   String(openTime),
      close_time:  String(closeTime),
      link_url:    ((linkUrl as string | undefined)?.trim() || null) as string | null,
      is_active:   true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An exam for this day already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exam: data }, { status: 201 })
}
