import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, titleFor } from './platform-console.utils'

describe('platform console utilities', () => {
  it('formats money in ETB using the existing whole-birr display', () => {
    expect(formatMoney(123456)).toBe('1,235 ETB')
    expect(formatMoney(0)).toBe('0 ETB')
  })

  it('maps pages to their console titles', () => {
    expect(titleFor('dashboard')).toBe('Dashboard')
    expect(titleFor('applications')).toBe('Applications')
    expect(titleFor('restaurants')).toBe('Restaurants')
    expect(titleFor('marketing')).toBe('Marketing')
    expect(titleFor('operations')).toBe('Operations')
    expect(titleFor('audit')).toBe('Audit logs')
  })

  it('formats dates through the browser locale path used by the UI', () => {
    expect(formatDate('2026-05-15T08:00:00.000Z')).toBe(
      new Date('2026-05-15T08:00:00.000Z').toLocaleString(),
    )
  })
})
