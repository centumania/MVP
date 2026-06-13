/**
 * PATCH /api/admin/exams/[id] — update exam link_url
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { Exam } from '@/src/types/database'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }
type ExamUpdate = Partial<Pick<Exam, 'link_url'>>

export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed: ExamUpdate = {}
  if ('linkUrl' in body) {
    allowed.link_url = (body.linkUrl as string)?.trim() || null
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exams')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exam: data })
}
