import { gql } from '@apollo/client'

export const DASHBOARD = gql`
  query PlatformDashboard {
    platformDashboard {
      totalShops
      activeShops
      pendingApplications
      totalOrders
      paidOrders
      failedPayments
      totalRevenueCent
    }
  }
`
