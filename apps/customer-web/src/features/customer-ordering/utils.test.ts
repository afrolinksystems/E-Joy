import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  CUSTOMER_ORDER_IDS_KEY,
  buildCartKey,
  formatBirr,
  persistCustomerOrderIds,
  readCustomerOrderIds,
  resolveProductImageUrl,
  tabLabel,
} from './customer-ordering.utils'

vi.mock('../../lib/mockTelebirrRedirectUrl', () => ({
  getOrderServiceHttpOrigin: () => 'http://localhost:9602',
}))

describe('customer ordering utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('formats cents as ETB without changing existing rounding behavior', () => {
    expect(formatBirr(1200)).toBe('12 ETB')
    expect(formatBirr(1250)).toBe('12.50 ETB')
  })

  it('normalizes product image URLs', () => {
    expect(resolveProductImageUrl('https://cdn.example.com/food.jpg')).toBe(
      'https://cdn.example.com/food.jpg',
    )
    expect(resolveProductImageUrl('uploads/food.jpg')).toBe(
      'http://localhost:9602/uploads/food.jpg',
    )
  })

  it('persists at most 50 customer order ids and ignores invalid storage', () => {
    const ids = Array.from({ length: 55 }, (_, index) => `order-${index}`)
    persistCustomerOrderIds(ids)

    expect(readCustomerOrderIds()).toHaveLength(50)
    expect(readCustomerOrderIds()[0]).toBe('order-0')

    localStorage.setItem(CUSTOMER_ORDER_IDS_KEY, '{bad json')
    expect(readCustomerOrderIds()).toEqual([])
  })

  it('keeps cart key and tab labels stable', () => {
    expect(buildCartKey('p1', ' mild ')).toBe('p1::mild')
    expect(tabLabel('menu')).toBe('Order')
    expect(tabLabel('profile')).toBe('Me')
  })
})
