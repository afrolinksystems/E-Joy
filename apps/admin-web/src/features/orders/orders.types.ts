import type { RefObject } from 'react'
import type { MerchantDispatchOrderRow } from '../../graphql/merchantOrders'

export type OrderStatusAction = 'PREPARING' | 'COMPLETED' | 'CANCELLED'

export type KitchenPrintState = {
  kitchenPrintRef: RefObject<HTMLDivElement | null>
  orderToPrint: MerchantDispatchOrderRow | null
  requestKitchenPrint: (order: MerchantDispatchOrderRow) => void
}

