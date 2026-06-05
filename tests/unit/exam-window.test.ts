import { describe, it, expect } from 'vitest'
import { getTodayInIST, formatDuration, getExamWindowStatus } from '../../src/lib/exam-window'

describe('getTodayInIST', () => {
  it('returns YYYY-MM-DD in IST', () => {
    // 23:00 UTC on June 4 = 04:30 IST on June 5
    const utc = new Date('2026-06-04T23:00:00Z')
    expect(getTodayInIST(utc)).toBe('2026-06-05')
  })

  it('handles midnight boundary correctly', () => {
    // 18:29 UTC = 23:59 IST June 4
    expect(getTodayInIST(new Date('2026-06-04T18:29:00Z'))).toBe('2026-06-04')
    // 18:30 UTC = 00:00 IST June 5
    expect(getTodayInIST(new Date('2026-06-04T18:30:00Z'))).toBe('2026-06-05')
  })
})

describe('formatDuration', () => {
  it('returns "0 seconds" for zero or negative', () => {
    expect(formatDuration(0)).toBe('0 seconds')
    expect(formatDuration(-1000)).toBe('0 seconds')
  })

  it('formats hours and minutes for ≥1h', () => {
    const ms = (2 * 3600 + 30 * 60) * 1000
    expect(formatDuration(ms)).toBe('2 hours 30 minutes')
  })

  it('omits seconds when ≥5 minutes', () => {
    expect(formatDuration(10 * 60 * 1000)).toBe('10 minutes')
    expect(formatDuration(5 * 60 * 1000)).toBe('5 minutes')
  })

  it('shows seconds when <5 minutes', () => {
    expect(formatDuration(4 * 60 * 1000 + 30 * 1000)).toBe('4 minutes 30 seconds')
    expect(formatDuration(59 * 1000)).toBe('59 seconds')
  })

  it('uses singular/plural correctly', () => {
    expect(formatDuration(1 * 3600 * 1000 + 1 * 60 * 1000)).toBe('1 hour 1 minute')
    expect(formatDuration(2 * 3600 * 1000 + 2 * 60 * 1000)).toBe('2 hours 2 minutes')
  })
})

describe('getExamWindowStatus', () => {
  const open  = new Date('2026-06-05T00:30:00Z') // 6:00 IST
  const close = new Date('2026-06-05T03:00:00Z') // 8:30 IST

  it('reports closed when before open time', () => {
    const now = new Date('2026-06-04T23:00:00Z') // 4:30 IST
    const s = getExamWindowStatus(now, open, close, false)
    expect(s.isOpen).toBe(false)
    expect(s.opensIn).toBeTruthy()
    expect(s.closesIn).toBeNull()
  })

  it('reports open at exactly open time (inclusive)', () => {
    const s = getExamWindowStatus(open, open, close, false)
    expect(s.isOpen).toBe(true)
    expect(s.closesIn).toBeTruthy()
  })

  it('reports open during window', () => {
    const now = new Date('2026-06-05T01:45:00Z') // 7:15 IST
    const s = getExamWindowStatus(now, open, close, false)
    expect(s.isOpen).toBe(true)
  })

  it('reports closed at exactly close time (exclusive)', () => {
    const s = getExamWindowStatus(close, open, close, false)
    expect(s.isOpen).toBe(false)
  })

  it('reports closed after window with next-day opensIn', () => {
    const now = new Date('2026-06-05T04:00:00Z') // 9:30 IST
    const s = getExamWindowStatus(now, open, close, false)
    expect(s.isOpen).toBe(false)
    expect(s.opensIn).toBeTruthy()
    expect(s.message).toContain('closed')
  })

  it('returns cohort-end message on last day after close', () => {
    const now = new Date('2026-06-05T04:00:00Z')
    const s = getExamWindowStatus(now, open, close, true)
    expect(s.isOpen).toBe(false)
    expect(s.opensIn).toBeNull()
    expect(s.message).toContain('final exam')
  })

  it('includes serverTimeIST with +05:30 offset', () => {
    const s = getExamWindowStatus(new Date(), open, close, false)
    expect(s.serverTimeIST).toContain('+05:30')
  })
})
