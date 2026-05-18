import type { DashboardMetrics } from '../dashboard.types'
import { DashboardMetricCard } from './DashboardMetricCard'

type DashboardMetricGridProps = {
  metrics?: DashboardMetrics
}

export function DashboardMetricGrid({ metrics }: DashboardMetricGridProps) {
  const topItemsLabel = metrics?.topDishes?.length
    ? `${metrics.topDishes.length} dish${metrics.topDishes.length === 1 ? '' : 'es'} in ranking`
    : 'No paid orders yet today'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardMetricCard label="Today's Revenue" value={metrics != null ? `${metrics.todayRevenue.toFixed(2)} Birr` : 'â€”'} />
      <DashboardMetricCard label="Avg. Prep Time" value={metrics != null ? `${metrics.avgPrepMinutes.toFixed(1)} min` : 'â€”'} />
      <DashboardMetricCard className="sm:col-span-2 lg:col-span-1" label="Top items (today)" value={topItemsLabel} />
    </div>
  )
}
