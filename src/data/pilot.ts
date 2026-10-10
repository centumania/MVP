// src/data/pilot.ts
// SINGLE SOURCE OF TRUTH for the Vijayadashami pilot batch (Karaikal) — the
// free orientation, the 90-day programme and its Centum Index refund slabs.
// Consumed by: /pilot page, /api/pilot/register, tests/unit/pilot.test.ts.
//
// Anything still marked `null` is an open launch decision. The page renders
// "to be announced" for it rather than inventing a value — fill these in
// before advertising (venue, time, fee).

import { getRefundTier } from '@/src/types/centum'

export const PILOT = {
  name: 'CentuMania Study Arena — Vijayadashami Pilot Batch',
  city: 'Karaikal',
  /** Orientation + batch start (IST). Vijayadashami 2026. */
  startDate: '2026-10-20',
  /** e.g. '10:00 AM – 11:30 AM' — null until confirmed. */
  orientationTime: null as string | null,
  /** Full venue address — null until confirmed. */
  venue: null as string | null,
  /** Pilot programme fee in ₹ — null until decided. */
  feeINR: null as number | null,
  /** Programme length; the go / adjust / expand review is at Day 60. */
  days: 90,
  reviewDay: 60,
  /** Target exam the five-paper analysis is built for. */
  targetExam: 'Puducherry LDC / UDC',
  /** Number of previous question papers analysed for the orientation. */
  papersAnalysed: 5,
  whatsapp: '917200132957',
  whatsappDisplay: '+91 72001 32957',
  /** Mirrors the existing /refund processing promise. */
  refundProcessingBusinessDays: 7,
} as const

/** Used only for the worked refund example while PILOT.feeINR is undecided. */
export const ILLUSTRATIVE_FEE_INR = 4999

/**
 * Refund slabs, highest first. Thresholds and percentages are the ones
 * production already enforces in getRefundTier() — kept in step by a unit test.
 * Ranges are half-open so 85 and 95 belong to exactly one slab.
 */
export const REFUND_SLABS = [
  { tier: 'gold',   name: 'Gold',   min: 95, max: null, pct: 50 },
  { tier: 'silver', name: 'Silver', min: 85, max: 95,   pct: 35 },
  { tier: 'bronze', name: 'Bronze', min: 75, max: 85,   pct: 25 },
] as const

export type RefundSlab = (typeof REFUND_SLABS)[number]

/** The slab a final Centum Index falls in, or null below 75. */
export function slabFor(index: number): RefundSlab | null {
  const tier = getRefundTier(index).tier
  return REFUND_SLABS.find(s => s.tier === tier) ?? null
}

/** Refund and net fee for a slab, in ₹ rounded to the paisa. */
export function refundFor(feeINR: number, pct: number): { refund: number; net: number } {
  const refund = Math.round(feeINR * pct) / 100
  return { refund, net: Math.round((feeINR - refund) * 100) / 100 }
}

/** ₹2,499.50 / ₹4,999 — paise shown only when non-zero. */
export function formatRupees(n: number): string {
  const whole = Number.isInteger(n)
  return '₹' + n.toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

// ── Registration form whitelist (shared by the form and the API) ─────────
export const PILOT_EXAMS = [
  { value: 'py_ldc_udc', en: 'Puducherry LDC / UDC',   ta: 'புதுச்சேரி LDC / UDC' },
  { value: 'tnpsc',      en: 'TNPSC Group 2 / 4',      ta: 'TNPSC குரூப் 2 / 4' },
  { value: 'ssc',        en: 'SSC (CGL / CHSL / MTS)', ta: 'SSC (CGL / CHSL / MTS)' },
  { value: 'rrb',        en: 'RRB (NTPC / Group D)',   ta: 'RRB (NTPC / Group D)' },
  { value: 'banking',    en: 'Banking (IBPS / SBI)',   ta: 'வங்கி (IBPS / SBI)' },
  { value: 'undecided',  en: 'Not decided yet',        ta: 'இன்னும் முடிவு செய்யவில்லை' },
] as const

export const PILOT_STAGES = [
  { value: 'starting',   en: 'Just starting',              ta: 'இப்போதுதான் தொடங்குகிறேன்' },
  { value: 'preparing',  en: 'Preparing, not consistent',  ta: 'படிக்கிறேன், ஆனால் தொடர்ச்சி இல்லை' },
  { value: 'attempted',  en: 'Attempted the exam before',  ta: 'முன்பே தேர்வு எழுதியுள்ளேன்' },
] as const

export const PILOT_SOURCES = [
  { value: 'instagram', en: 'Instagram',          ta: 'Instagram' },
  { value: 'whatsapp',  en: 'WhatsApp',           ta: 'WhatsApp' },
  { value: 'friend',    en: 'Friend / referral',  ta: 'நண்பர் பரிந்துரை' },
  { value: 'college',   en: 'College',            ta: 'கல்லூரி' },
  { value: 'other',     en: 'Other',              ta: 'மற்றவை' },
] as const

const values = <T extends readonly { value: string }[]>(list: T) => list.map(o => o.value) as string[]

export type PilotRegistration = {
  name: string
  phone: string
  exam: string
  stage: string
  source: string | null
  lang: 'en' | 'ta'
}

/**
 * Validates and normalises a registration body. Returns the clean row, or an
 * error code the client maps to a message. Phone is a 10-digit Indian mobile;
 * a leading +91 / 91 / 0 and any spaces or dashes are stripped.
 */
export function parsePilotRegistration(
  body: Record<string, unknown>,
): { ok: true; row: PilotRegistration } | { ok: false; error: 'name' | 'phone' | 'exam' | 'stage' } {
  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim() : ''
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'name' }

  let digits = typeof body.phone === 'string' ? body.phone.replace(/[\s()-]/g, '') : ''
  digits = digits.replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '')
  if (!/^[6-9]\d{9}$/.test(digits)) return { ok: false, error: 'phone' }

  const exam = typeof body.exam === 'string' && values(PILOT_EXAMS).includes(body.exam) ? body.exam : null
  if (!exam) return { ok: false, error: 'exam' }

  const stage = typeof body.stage === 'string' && values(PILOT_STAGES).includes(body.stage) ? body.stage : null
  if (!stage) return { ok: false, error: 'stage' }

  const source = typeof body.source === 'string' && values(PILOT_SOURCES).includes(body.source) ? body.source : null
  const lang = body.lang === 'ta' ? 'ta' : 'en'

  return { ok: true, row: { name, phone: digits, exam, stage, source, lang } }
}
