/**
 * Admin Auth Utility
 *
 * verifyAdmin(request) — validates JWT and checks is_admin = true.
 * Returns { user, profile } on success, or throws a NextResponse on failure.
 *
 * All admin API routes call this first. One function, one place to update.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from './supabase/server'

export type AdminContext = {
  userId: string
  email: string
}

/**
 * Returns AdminContext if the request carries a valid admin JWT.
 * Throws a NextResponse (401 or 403) if not authenticated or not admin.
 *
 * Usage in an API route:
 *   const ctx = await requireAdmin(request)
 *   if (ctx instanceof NextResponse) return ctx
 */
export async function requireAdmin(request: NextRequest): Promise<AdminContext | NextResponse> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId: user.id, email: user.email ?? '' }
}
