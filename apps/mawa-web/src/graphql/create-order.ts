import { gql } from "@apollo/client";

export const CREATE_ORDER = gql`
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
`;
