import type { DashboardMetrics, TopDishChartRow } from './dashboard.types'

export function truncateLabel(name: string, max = 20): string {
  const trimmed = name.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}â€¦`
}

export function topDishChartRows(metrics: DashboardMetrics | undefined): TopDishChartRow[] {
  return metrics?.topDishes.map((dish) => ({
    label: truncateLabel(dish.name),
    fullName: dish.name,
    count: dish.count,
  })) ?? []
}
