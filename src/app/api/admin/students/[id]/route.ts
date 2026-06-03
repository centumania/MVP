/**
 * GET    /api/admin/students/[id] — student detail + submission history
 * PATCH  /api/admin/students/[id] — update profile fields
 * DELETE /api/admin/students/[id] — delete student
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { Profile } from '@/src/types/database'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('submissions')
      .select('id, score, total_marks, submitted_at, exam_id')
      .eq('user_id', id)
      .order('submitted_at', { ascending: false }),
  ])

  if (!profile) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const totalScore    = (submissions ?? []).reduce((a, s) => a + s.score, 0)
  const totalPossible = (submissions ?? []).reduce((a, s) => a + s.total_marks, 0)
  const accuracy      = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

  return NextResponse.json({
    profile,
    submissions: submissions ?? [],
    stats: {
      daysAttended: submissions?.length ?? 0,
      totalScore,
      accuracy,
    },
  })
}

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

  type ProfileUpdate = Partial<Pick<Profile, 'payment_verified' | 'tier' | 'name' | 'phone'>>
  const allowed: ProfileUpdate = {}
  if ('payment_verified' in body) allowed.payment_verified = Boolean(body.payment_verified)
  if ('tier'             in body) allowed.tier             = (body.tier as Profile['tier']) ?? null
  if ('name'             in body && typeof body.name === 'string') allowed.name = body.name.trim()
  if ('phone'            in body) allowed.phone            = (body.phone as string | null) ?? null

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  if (ctx.userId === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  // Deleting from auth.users cascades to profiles + submissions via FK
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
