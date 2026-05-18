import type { MerchantDispatchOrderRow } from '../../graphql/merchantOrders'
import type { TableRow } from '../../graphql/tables'

export type TablePosition = {
  posX: number
  posY: number
}

export type TableDragState = {
  id: string
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}

export type TableMutationState = {
  creatingTable: boolean
  deletingTable: boolean
  savingLayout: boolean
  updatingTable: boolean
}

export type TableDetailState = {
  ordersForSelectedTable: MerchantDispatchOrderRow[]
  primaryOrder: MerchantDispatchOrderRow | null
  selected: TableRow | null
}

