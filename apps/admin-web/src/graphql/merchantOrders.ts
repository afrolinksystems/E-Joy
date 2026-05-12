import { gql } from '@apollo/client'

export const MERCHANT_DISPATCH_ORDERS = gql`
  query MerchantDispatchOrders($shopId: String) {
    merchantDispatchOrders(shopId: $shopId) {
      id
      orderNo
      totalAmount
      status
      orderState
      createdAt
      shopName
      tableName
      acceptedAt
      completedAt
      items {
        productName
        quantity
        imageUrl
      }
    }
  }
`

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: String!, $status: OrderStatus!, $shopId: String) {
    updateOrderStatus(id: $id, status: $status, shopId: $shopId) {
      id
      orderNo
      totalAmount
      status
      orderState
      createdAt
      shopName
      tableName
      acceptedAt
      completedAt
      items {
        productName
        quantity
        imageUrl
      }
    }
  }
`

export type MerchantDispatchOrderRow = {
  id: string
  orderNo: string
  totalAmount: number
  status: 'PENDING' | 'PREPARING' | 'COMPLETED' | 'CANCELLED'
  /** Canonical order lifecycle from backend (`OrderState`). */
  orderState: string
  createdAt: string
  shopName: string
  tableName?: string | null
  acceptedAt?: string | null
  completedAt?: string | null
  items: Array<{
    productName: string
    quantity: number
    imageUrl?: string | null
  }>
}

export type MerchantDispatchData = {
  merchantDispatchOrders: MerchantDispatchOrderRow[]
}
