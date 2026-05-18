import type { Status } from '../platform-console/platform-console.types'

export type Application = {
  id: string
  shopName: string
  contactName: string
  contactPhone: string
  status: Status
  rejectReason?: string | null
  createdShopId?: string | null
}
