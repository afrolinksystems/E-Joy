import { gql } from '@apollo/client'

export const GET_DASHBOARD_METRICS = gql`
  query AdminDashboardMetrics($shopId: String!) {
    getDashboardMetrics(shopId: $shopId) {
      todayRevenue
      avgPrepMinutes
      topDishes {
        name
        count
      }
    }
  }
`

export type DashboardMetricsData = {
  getDashboardMetrics: {
    todayRevenue: number
    avgPrepMinutes: number
    topDishes: { name: string; count: number }[]
  }
}
