import { Loader2 } from 'lucide-react'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardMetricGrid } from './components/DashboardMetricGrid'
import { TopDishesChart } from './components/TopDishesChart'
import { topDishChartRows } from './dashboard.utils'
import { useDashboardMetrics } from './hooks/useDashboardMetrics'

export function DashboardPage() {
  const { error, loading, metrics, refetch, shopId } = useDashboardMetrics()
  const chartRows = topDishChartRows(metrics)

  return (
    <div className="space-y-6">
      <DashboardHeader shopId={shopId} />
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-medium">Could not load metrics.</span> {error.message}
          <button type="button" className="ml-3 text-orange-700 underline hover:text-orange-900" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      ) : null}
      {loading && !metrics ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
          Loading dashboardâ€¦
        </div>
      ) : (
        <>
          <DashboardMetricGrid metrics={metrics} />
          <TopDishesChart rows={chartRows} />
        </>
      )}
    </div>
  )
}
