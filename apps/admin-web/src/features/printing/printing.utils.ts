import type { MerchantDispatchOrderRow } from '../../graphql/merchantOrders'

const KITCHEN_PRINT_ORDER_STATES: ReadonlySet<string> = new Set([
  'PAID',
  'PREPARING',
  'READY',
])

export function canPrintKitchenTicket(order: MerchantDispatchOrderRow): boolean {
  if (order.status !== 'PENDING' && order.status !== 'PREPARING') return false
  return KITCHEN_PRINT_ORDER_STATES.has(order.orderState)
}

export function shortOrderId(id: string): string {
  return id.length <= 6 ? id : id.slice(-6)
}
