import { gql } from '@apollo/client'

export const RUN_PRINT_RETRY = gql`
  mutation RunPrintRetryCycle($shopId: String) {
    runPrintRetryCycle(shopId: $shopId) {
      processed
      succeeded
      failed
      alerted
    }
  }
`
