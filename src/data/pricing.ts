// src/data/pricing.ts
// SINGLE SOURCE OF TRUTH for exam programmes + pricing.
// `value` is what registration stores in auth user_metadata.program —
// do not change existing values (they live in real user records).
// Consumed by: register dropdown, PaymentGate, /payment, dashboard banner.
// (Landing Pricing.tsx still holds its own display copy — keep amounts in sync.)

export interface Programme {
  value: string        // stored in auth user_metadata.program
  label: string        // register dropdown label
  exam: string         // short display name, e.g. 'Banking'
  full: string         // full programme name
  priceINR: number     // founder-discounted one-time price
  originalINR: number  // strike-through price
  days: number         // programme length
}

export const PROGRAMMES: Programme[] = [
  { value: 'UDC',     label: 'UDC — Upper Division Clerk',     exam: 'UDC',     full: 'Upper Division Clerk',       priceINR: 1999, originalINR: 4999, days: 30 },
  { value: 'SSC',     label: 'SSC — CGL / CHSL / MTS / CPO',   exam: 'SSC',     full: 'Staff Selection Commission', priceINR: 3499, originalINR: 8999, days: 50 },
  { value: 'RRB',     label: 'RRB — NTPC / Group D',           exam: 'RRB',     full: 'Railway Recruitment Board',  priceINR: 2999, originalINR: 6999, days: 45 },
  { value: 'Banking', label: 'Banking — IBPS / SBI',           exam: 'Banking', full: 'IBPS / SBI',                 priceINR: 3999, originalINR: 9999, days: 60 },
]

// Founder-batch accounts predate programme selection (no user_metadata.program)
// — they are the original ₹999 UDC cohort.
export const DEFAULT_PROGRAMME = PROGRAMMES[0]

export function getProgramme(value: string | null | undefined): Programme {
  return PROGRAMMES.find(p => p.value === value) ?? DEFAULT_PROGRAMME
}

export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}
