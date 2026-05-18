import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Spinner } from '../../components/ui/spinner'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardMetricGrid } from './components/DashboardMetricGrid'
import { TopDishesChart } from './components/TopDishesChart'
import { topDishChartRows } from './dashboard.utils'
import { useDashboardMetrics } from './hooks/useDashboardMetrics'

export function DashboardPage() {
  const { error, loading, metrics, refetch, shopId } = useDashboardMetrics()
  const chartRows = topDishChartRows(metrics)

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader shopId={shopId} />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load metrics</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {loading && !metrics ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner className="size-6 text-primary" />
            Loading dashboard...
          </CardContent>
        </Card>
      ) : (
        <>
          <DashboardMetricGrid metrics={metrics} />
          <TopDishesChart rows={chartRows} />
        </>
      )}
    </div>
  )
}
