/**
 * GET /api/admin/students-intel
 *
 * Rajan's student-monitoring brain. For every paying/registered student it
 * combines the pre-aggregated `student_metrics` (materials/nodes/mcqs/sessions/
 * engagement/last_event_at) with their latest Centum Index row, then computes a
 * health status + human-readable reasons so at-risk students surface first.
 *
 * Read-only. Admin-gated. No writes, no external calls — safe by construction.
 * (Scale note: for thousands of students, move the per-student latest-centum
 * reduction into a SQL view/materialised view; fine as JS aggregation for now.)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Health = 'healthy' | 'watch' | 'at_risk' | 'never_started'

export interface StudentIntel {
  id: string
  name: string
  email: string | null
  phone: string | null
  registrationNumber: string | null
  paymentVerified: boolean
  createdAt: string
  lastActiveAt: string | null
  daysSinceActive: number | null
  engagementScore: number
  materialsOpened: number
  nodesCompleted: number
  mcqsCompleted: number
  mcqAccuracy: number | null
  studySessions: number
  centumIndex: number | null
  attendanceIndex: number | null
  health: Health
  reasons: string[]
  priority: number // higher = needs attention sooner (drives sort)
}

function daysBetween(fromIso: string | null, now: number): number | null {
  if (!fromIso) return null
  const t = Date.parse(fromIso)
  if (Number.isNaN(t)) return null
  return Math.floor((now - t) / 86_400_000)
}

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()
  const now = Date.now()

  const [{ data: profiles }, { data: metrics }, { data: centumRows }] = await Promise.all([
    supabase.from('profiles')
      .select('id, name, email, phone, registration_number, payment_verified, created_at')
      .eq('is_admin', false)
      .order('created_at', { ascending: true }),
    supabase.from('student_metrics')
      .select('user_id, materials_opened, nodes_completed, mcqs_completed, mcqs_correct, study_sessions, engagement_score, last_event_at'),
    supabase.from('centum_index_log')
      .select('user_id, calculated_date, attendance_index, centum_index')
      .order('calculated_date', { ascending: false }),
  ])

  const metricsByUser = new Map((metrics ?? []).map(m => [m.user_id, m]))
  // First row per user = latest (query is ordered date desc).
  const centumByUser = new Map<string, { attendance_index: number; centum_index: number }>()
  for (const r of centumRows ?? []) {
    if (!centumByUser.has(r.user_id)) {
      centumByUser.set(r.user_id, { attendance_index: Number(r.attendance_index), centum_index: Number(r.centum_index) })
    }
  }

  const students: StudentIntel[] = (profiles ?? []).map(p => {
    const m = metricsByUser.get(p.id)
    const c = centumByUser.get(p.id)
    const lastActiveAt = m?.last_event_at ?? null
    const daysSinceActive = daysBetween(lastActiveAt, now)
    const materialsOpened = m?.materials_opened ?? 0
    const nodesCompleted = m?.nodes_completed ?? 0
    const mcqsCompleted = m?.mcqs_completed ?? 0
    const mcqsCorrect = m?.mcqs_correct ?? 0
    const engagementScore = Math.round(Number(m?.engagement_score ?? 0))
    const studySessions = m?.study_sessions ?? 0
    const mcqAccuracy = mcqsCompleted > 0 ? Math.round((mcqsCorrect / mcqsCompleted) * 100) : null
    const centumIndex = c ? Math.round(c.centum_index * 10) / 10 : null
    const attendanceIndex = c ? Math.round(c.attendance_index * 10) / 10 : null

    const reasons: string[] = []
    let health: Health = 'healthy'
    let priority = 0

    if (!lastActiveAt || (materialsOpened === 0 && nodesCompleted === 0 && studySessions === 0)) {
      health = 'never_started'
      reasons.push('Never opened the app after registering')
      priority = p.payment_verified ? 100 : 40 // paid + never started = urgent
    } else {
      if (daysSinceActive !== null && daysSinceActive >= 3) {
        health = 'at_risk'
        reasons.push(`No activity for ${daysSinceActive} days`)
        priority += p.payment_verified ? 90 : 30
      } else if (daysSinceActive !== null && daysSinceActive >= 2) {
        health = 'watch'
        reasons.push(`Quiet for ${daysSinceActive} days`)
        priority += p.payment_verified ? 50 : 15
      }
      if (p.payment_verified && (centumIndex !== null && centumIndex < 20)) {
        if (health === 'healthy') health = 'watch'
        reasons.push(`Centum Index low (${centumIndex})`)
        priority += 20
      }
      if (materialsOpened === 0) {
        if (health === 'healthy') health = 'watch'
        reasons.push('Has not opened any study module')
        priority += 15
      }
      if (mcqsCompleted === 0 && nodesCompleted > 0) {
        reasons.push('Reads but never attempts MCQs')
        priority += 5
      }
    }

    // A paid student always outranks an unpaid one at the same health.
    if (p.payment_verified) priority += 5

    return {
      id: p.id,
      name: p.name ?? '—',
      email: p.email ?? null,
      phone: p.phone ?? null,
      registrationNumber: p.registration_number ?? null,
      paymentVerified: p.payment_verified === true,
      createdAt: p.created_at,
      lastActiveAt,
      daysSinceActive,
      engagementScore,
      materialsOpened,
      nodesCompleted,
      mcqsCompleted,
      mcqAccuracy,
      studySessions,
      centumIndex,
      attendanceIndex,
      health,
      reasons,
      priority,
    }
  })

  students.sort((a, b) => b.priority - a.priority || (b.engagementScore - a.engagementScore))

  const summary = {
    total: students.length,
    paid: students.filter(s => s.paymentVerified).length,
    atRisk: students.filter(s => s.health === 'at_risk').length,
    watch: students.filter(s => s.health === 'watch').length,
    neverStarted: students.filter(s => s.health === 'never_started').length,
    healthy: students.filter(s => s.health === 'healthy').length,
    // Paid students who are drifting — the ones costing money if they churn.
    paidAtRisk: students.filter(s => s.paymentVerified && (s.health === 'at_risk' || s.health === 'never_started')).length,
  }

  return NextResponse.json({ generatedAt: new Date().toISOString(), summary, students })
}
