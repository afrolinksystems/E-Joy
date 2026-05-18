import { describe, expect, it } from 'vitest'
import {
  formatOrderBirr,
  orderNeedsPayment,
  statusLabel,
  statusVariant,
} from './order-detail.utils'

describe('order detail utilities', () => {
  it('formats order money with two decimals', () => {
    expect(formatOrderBirr(1200)).toBe('12.00 Birr')
    expect(formatOrderBirr(1250)).toBe('12.50 Birr')
  })

  it('detects statuses that need payment', () => {
    expect(orderNeedsPayment('PENDING_PAYMENT')).toBe(true)
    expect(orderNeedsPayment('draft')).toBe(true)
    expect(orderNeedsPayment('PAID')).toBe(false)
  })

  it('maps order statuses to labels and badge variants', () => {
    expect(statusLabel('PREPARING')).toBe('Preparing')
    expect(statusLabel('PENDING')).toBe('Waiting for Telebirr payment')
    expect(statusVariant('CANCELLED')).toBe('destructive')
    expect(statusVariant('COMPLETED')).toBe('default')
    expect(statusVariant('READY')).toBe('outline')
  })
})
