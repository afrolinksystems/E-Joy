import { gql } from '@apollo/client'

export const GET_ORDERS_QUERY = gql`
  query GetOrders($ids: [ID!]) {
    getOrders(ids: $ids) {
      id
      totalAmount
      status
      createdAt
      items {
        quantity
        priceAtTime
        product {
          name
          imageUrl
        }
      }
    }
  }
`

export type OrderHistoryProduct = {
  name: string
  imageUrl?: string | null
}

export type OrderHistoryItem = {
  quantity: number
  priceAtTime: number
  product: OrderHistoryProduct
}

export type OrderHistoryRow = {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  items: OrderHistoryItem[]
}

export type GetOrdersData = {
  getOrders: OrderHistoryRow[]
}
