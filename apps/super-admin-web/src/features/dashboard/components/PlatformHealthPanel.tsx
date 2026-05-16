import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { HealthRow } from '../../platform-console/components/HealthRow'
import type { Dashboard } from '../dashboard.types'

type PlatformHealthPanelProps = {
  dashboard?: Dashboard
}

export function PlatformHealthPanel({ dashboard }: PlatformHealthPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <HealthRow label="Paid orders" value={dashboard?.paidOrders ?? 0} tone="green" />
          <HealthRow label="Failed payments" value={dashboard?.failedPayments ?? 0} tone="red" />
          <HealthRow label="Application backlog" value={dashboard?.pendingApplications ?? 0} tone="blue" />
        </div>
      </CardContent>
    </Card>
  )
}
