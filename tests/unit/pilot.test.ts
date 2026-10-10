import { describe, it, expect } from 'vitest'
import { getRefundTier } from '../../src/types/centum'
import {
  REFUND_SLABS, slabFor, refundFor, formatRupees, parsePilotRegistration,
} from '../../src/data/pilot'

describe('REFUND_SLABS', () => {
  it('match the tiers production enforces in getRefundTier', () => {
    for (const s of REFUND_SLABS) {
      expect(getRefundTier(s.min).tier).toBe(s.tier)
      expect(getRefundTier(s.min).label).toBe(`${s.pct}% Refund`)
      if (s.max !== null) expect(getRefundTier(s.max - 0.01).tier).toBe(s.tier)
    }
    expect(getRefundTier(74.99).tier).toBe('none')
  })

  it('assign the 85 and 95 boundaries to exactly one slab', () => {
    expect(slabFor(95)?.pct).toBe(50)
    expect(slabFor(94.99)?.pct).toBe(35)
    expect(slabFor(85)?.pct).toBe(35)
    expect(slabFor(84.99)?.pct).toBe(25)
    expect(slabFor(75)?.pct).toBe(25)
    expect(slabFor(74.99)).toBeNull()
  })
})

describe('refundFor', () => {
  it('computes the worked example at ₹4,999 to the paisa', () => {
    expect(refundFor(4999, 50)).toEqual({ refund: 2499.5, net: 2499.5 })
    expect(refundFor(4999, 35)).toEqual({ refund: 1749.65, net: 3249.35 })
    expect(refundFor(4999, 25)).toEqual({ refund: 1249.75, net: 3749.25 })
  })
})

describe('formatRupees', () => {
  it('shows paise only when non-zero', () => {
    expect(formatRupees(4999)).toBe('₹4,999')
    expect(formatRupees(2499.5)).toBe('₹2,499.50')
  })
})

describe('parsePilotRegistration', () => {
  const base = { name: '  Priya   S ', phone: '+91 98765-43210', exam: 'py_ldc_udc', stage: 'starting', lang: 'ta' }

  it('normalises a valid registration', () => {
    const r = parsePilotRegistration(base)
    expect(r).toEqual({ ok: true, row: { name: 'Priya S', phone: '9876543210', exam: 'py_ldc_udc', stage: 'starting', source: null, lang: 'ta' } })
  })

  it('strips 91 / 0 prefixes but keeps 10-digit numbers starting with 91', () => {
    const phone = (p: string) => { const r = parsePilotRegistration({ ...base, phone: p }); return r.ok ? r.row.phone : r.error }
    expect(phone('919876543210')).toBe('9876543210')
    expect(phone('09876543210')).toBe('9876543210')
    expect(phone('9100012345')).toBe('9100012345')
    expect(phone('12345')).toBe('phone')
    expect(phone('5876543210')).toBe('phone')
  })

  it('rejects unknown enum values and drops an unknown source', () => {
    expect(parsePilotRegistration({ ...base, exam: 'x' })).toEqual({ ok: false, error: 'exam' })
    expect(parsePilotRegistration({ ...base, stage: 'x' })).toEqual({ ok: false, error: 'stage' })
    expect(parsePilotRegistration({ ...base, name: 'A' })).toEqual({ ok: false, error: 'name' })
    const r = parsePilotRegistration({ ...base, source: '<script>' })
    expect(r.ok && r.row.source).toBeNull()
  })
})
