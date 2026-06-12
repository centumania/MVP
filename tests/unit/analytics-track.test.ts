import { describe, it, expect } from 'vitest'
import { ALLOWED_EVENTS, isAllowedEvent, getSessionId } from '../../src/lib/analytics/track'

describe('ALLOWED_EVENTS', () => {
  it('contains all 7 required event names', () => {
    expect(ALLOWED_EVENTS).toContain('login')
    expect(ALLOWED_EVENTS).toContain('material_opened')
    expect(ALLOWED_EVENTS).toContain('daily_material_completed')
    expect(ALLOWED_EVENTS).toContain('node_opened')
    expect(ALLOWED_EVENTS).toContain('node_completed')
    expect(ALLOWED_EVENTS).toContain('mcq_started')
    expect(ALLOWED_EVENTS).toContain('mcq_completed')
    expect(ALLOWED_EVENTS).toHaveLength(7)
  })
})

describe('isAllowedEvent', () => {
  it('returns true for valid event names', () => {
    expect(isAllowedEvent('login')).toBe(true)
    expect(isAllowedEvent('material_opened')).toBe(true)
    expect(isAllowedEvent('mcq_completed')).toBe(true)
  })

  it('returns false for unknown event names', () => {
    expect(isAllowedEvent('page_view')).toBe(false)
    expect(isAllowedEvent('')).toBe(false)
    expect(isAllowedEvent('LOGIN')).toBe(false)
  })
})

describe('getSessionId', () => {
  it('returns a non-empty string', () => {
    // getSessionId reads sessionStorage — not available in node test env,
    // but the function must not throw
    const id = getSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns the same value on repeated calls', () => {
    const first  = getSessionId()
    const second = getSessionId()
    expect(first).toBe(second)
  })
})
