import { gql } from '@apollo/client'

export const CONFIRM_MOCK_TELEBIRR_PAYMENT = gql`
  mutation ConfirmMockTelebirrPayment($orderId: String!) {
    confirmMockTelebirrPayment(orderId: $orderId)
  }
`

export type ConfirmMockTelebirrPaymentData = {
  confirmMockTelebirrPayment: boolean
}
