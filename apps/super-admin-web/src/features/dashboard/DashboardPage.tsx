import { PanelLoader } from '../platform-console/components/PanelLoader'
import { DashboardMetricGrid } from './components/DashboardMetricGrid'
import { PlatformHealthPanel } from './components/PlatformHealthPanel'
import { usePlatformDashboard } from './hooks/usePlatformDashboard'

export function DashboardPage() {
  const { data, loading } = usePlatformDashboard()
  if (loading && !data) return <PanelLoader />

  return (
    <div className="flex flex-col gap-5">
      <DashboardMetricGrid dashboard={data?.platformDashboard} />
      <PlatformHealthPanel dashboard={data?.platformDashboard} />
    </div>
  )
}
