import { gql } from '@apollo/client'

export const GET_ORDER_QUERY = gql`
  query GetOrder($id: ID!) {
    getOrder(id: $id) {
      id
      orderNo
      totalAmount
      status
      createdAt
      shopName
      tableName
      deliveryType
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

export type OrderDetailData = {
  getOrder: {
    id: string
    orderNo: string
    totalAmount: number
    status: string
    createdAt: string
    shopName: string
    tableName?: string | null
    deliveryType: string
    items: Array<{
      quantity: number
      priceAtTime: number
      product: { name: string; imageUrl?: string | null }
    }>
  } | null
}
