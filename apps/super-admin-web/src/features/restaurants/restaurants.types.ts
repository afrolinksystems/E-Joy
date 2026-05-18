import type { ShopStatus } from '../platform-console/platform-console.types'

export type ManagedShop = {
  id: string
  name: string
  status: ShopStatus
  updatedAt: string
  updatedBy?: string | null
  orderCount: number
  revenueCent: number
}

export type ManagedShopDetail = {
  shop: ManagedShop
  managers: Array<{ id: string; name: string; phone: string; role: string; status: string }>
  paymentConfig?: {
    id: string
    provider: string
    merchantId?: string | null
    appId?: string | null
    enabled: boolean
    testMode: boolean
    updatedBy?: string | null
  } | null
}

export type PaymentConfigFormState = {
  provider: string
  merchantId: string
  appId: string
  enabled: boolean
  testMode: boolean
}
