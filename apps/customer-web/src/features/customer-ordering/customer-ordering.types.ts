import type { CSSProperties } from 'react'
import type { ShopMenuProduct } from '../../graphql/shopMenu'

export type CustomerTab = 'home' | 'menu' | 'orders' | 'profile'
export type MenuItem = ShopMenuProduct

export type CreateOrderData = {
  createOrder?: {
    ok: boolean
    error?: { code?: string; message?: string } | null
    order?: {
      id: string
      orderNo: string
      state: string
      paymentState: string
      totalAmount: number
    } | null
  } | null
}

export type CreatedOrderModel = NonNullable<
  NonNullable<CreateOrderData['createOrder']>['order']
>

export type CustomerThemeStyle = CSSProperties & Record<string, string>
