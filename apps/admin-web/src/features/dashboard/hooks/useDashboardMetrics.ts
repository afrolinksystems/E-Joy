import { useQuery } from '@apollo/client/react'
import { GET_DASHBOARD_METRICS, type DashboardMetricsData } from '../../../graphql/dashboard'
import { useAdminSession } from '../../../lib/adminSession'

export function useDashboardMetrics() {
  const { shopId } = useAdminSession()
  const query = useQuery<DashboardMetricsData>(GET_DASHBOARD_METRICS, {
    variables: { shopId },
    pollInterval: 60_000,
    fetchPolicy: 'network-only',
  })

  return {
    ...query,
    metrics: query.data?.getDashboardMetrics,
    shopId,
  }
}
