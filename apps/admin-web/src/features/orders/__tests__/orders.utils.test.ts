import { describe, expect, it, vi } from 'vitest'
import { formatBirr, formatRelativeEn, shortId } from '../orders.utils'

describe('orders utils', () => {
  it('formats cents as Birr', () => {
    expect(formatBirr(12345)).toBe('123.45 Birr')
  })

  it('shortens long ids from the end', () => {
    expect(shortId('order-abcdef')).toBe('abcdef')
    expect(shortId('abc')).toBe('abc')
  })

  it('formats recent relative timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T10:00:30.000Z'))
    expect(formatRelativeEn('2026-05-15T10:00:00.000Z')).toBe('30s ago')
    vi.useRealTimers()
  })
})
