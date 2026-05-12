import { gql } from '@apollo/client'

/** 顾客端下单：金额由服务端按 Product.unitPrice 重算，勿传客户端单价 */
export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ok
      error {
        code
        message
      }
      order {
        id
        orderNo
        state
        paymentState
        totalAmount
      }
    }
  }
`
