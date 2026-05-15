import type { DashboardMetricsData } from '../../graphql/dashboard'

export type DashboardMetrics = DashboardMetricsData['getDashboardMetrics']

export type TopDishChartRow = {
  count: number
  fullName: string
  label: string
}
