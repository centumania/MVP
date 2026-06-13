/**
 * CentuMania — Centum Index Types
 *
 * Color palette matches the existing codebase design tokens:
 *   #0B3D91 = primary green (top tier)
 *   #0B3D91 = teal (second tier)
 *   #F59E0B = amber/warning (third tier)
 *   #EF4444 = error/red (below threshold)
 */

export interface CentumIndexLog {
  id: string
  user_id: string
  batch_id: string
  calculated_date: string
  tests_conducted: number
  tests_submitted: number
  attendance_index: number
  nodes_assigned: number
  nodes_completed: number
  node_completion_pct: number
  first_attempt_correct: number
  first_attempt_total: number
  first_attempt_acc_pct: number
  node_index: number
  centum_index: number
}

export interface CentumBreakdown {
  centum_index: number
  attendance_index: number
  node_index: number
  tests_conducted: number
  tests_submitted: number
  nodes_assigned: number
  nodes_completed: number
  first_attempt_acc_pct: number
}

export type RefundTier = 'gold' | 'silver' | 'bronze' | 'none'

export function getRefundTier(score: number): {
  tier: RefundTier
  label: string
  color: string
} {
  if (score >= 95) return { tier: 'gold',   label: '50% Refund', color: '#0B3D91' }
  if (score >= 85) return { tier: 'silver', label: '35% Refund', color: '#0B3D91' }
  if (score >= 75) return { tier: 'bronze', label: '25% Refund', color: '#F59E0B' }
  return             { tier: 'none',   label: 'No Refund',  color: '#EF4444' }
}

export function getCentumColor(score: number): string {
  if (score >= 95) return '#0B3D91'
  if (score >= 85) return '#0B3D91'
  if (score >= 75) return '#F59E0B'
  return '#EF4444'
}
