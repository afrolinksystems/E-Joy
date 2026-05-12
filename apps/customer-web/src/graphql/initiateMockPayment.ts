import { gql } from '@apollo/client'

/**
 * Optional: backend `initiateMockPayment(orderId: String!): String!`.
 * Customer order detail uses `buildMockTelebirrRedirectUrl` instead (same URL, no GraphQL).
 */
export const INITIATE_MOCK_PAYMENT = gql`
  mutation InitiateMockPayment($orderId: String!) {
    initiateMockPayment(orderId: $orderId)
  }
`

export type InitiateMockPaymentMutationData = {
  initiateMockPayment: string
}
