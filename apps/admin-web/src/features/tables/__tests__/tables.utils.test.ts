import { describe, expect, it } from 'vitest'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import type { TableRow } from '../../../graphql/tables'
import {
  buildCustomerTableLink,
  getOpenOrdersForTable,
  snap01,
} from '../tables.utils'

describe('tables utils', () => {
  it('snaps normalized positions to the floor grid', () => {
    expect(snap01(0.031)).toBe(0.04)
    expect(snap01(-1)).toBe(0)
    expect(snap01(2)).toBe(1)
  })

  it('finds open orders for the selected table newest first', () => {
    const table = tableRow('T1')
    const openOld = orderRow('old', 'T1', 'PENDING', '2026-05-15T10:00:00Z')
    const openNew = orderRow('new', 'T1', 'PREPARING', '2026-05-15T11:00:00Z')
    const closed = orderRow('closed', 'T1', 'COMPLETED', '2026-05-15T12:00:00Z')
    expect(getOpenOrdersForTable([openOld, openNew, closed], table)).toEqual([
      openNew,
      openOld,
    ])
  })

  it('returns an empty customer QR link when the base URL is absent', () => {
    expect(buildCustomerTableLink(tableRow('T1'))).toBe('')
  })
})

function tableRow(tableNumber: string): TableRow {
  return {
    id: tableNumber,
    tableNumber,
    capacity: 4,
    posX: 0.5,
    posY: 0.5,
    status: 'AVAILABLE',
    shopId: 'shop-1',
  }
}

function orderRow(
  id: string,
  tableName: string,
  status: MerchantDispatchOrderRow['status'],
  createdAt: string,
): MerchantDispatchOrderRow {
  return {
    id,
    orderNo: id,
    totalAmount: 100,
    status,
    orderState: status,
    createdAt,
    shopName: 'Shop',
    tableName,
    items: [],
  }
}

