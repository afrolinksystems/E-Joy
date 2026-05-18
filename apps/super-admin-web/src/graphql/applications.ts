import { gql } from '@apollo/client'

export const APPLICATIONS = gql`
  query ShopApplications($status: ApplicationStatusModel) {
    shopApplications(status: $status) {
      id
      shopName
      contactName
      contactPhone
      status
      rejectReason
      createdShopId
    }
  }
`

export const APPROVE_APPLICATION = gql`
  mutation ApproveShopApplication($shopId: String!, $input: ApproveShopApplicationInput) {
    approveShopApplication(shopId: $shopId, input: $input) {
      ok
      shopId
      managerStaffId
      temporaryPassword
    }
  }
`

export const REJECT_APPLICATION = gql`
  mutation RejectShopApplication($shopId: String!, $reason: String!) {
    rejectShopApplication(shopId: $shopId, reason: $reason)
  }
`
