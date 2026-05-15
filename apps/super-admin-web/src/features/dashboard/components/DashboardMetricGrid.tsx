import { BadgeDollarSign, Building2, ClipboardList, ReceiptText } from 'lucide-react'
import { MetricCard } from '../../platform-console/components/MetricCard'
import { formatMoney } from '../../platform-console/platform-console.utils'
import type { Dashboard } from '../dashboard.types'

type DashboardMetricGridProps = {
  dashboard?: Dashboard
}

export function DashboardMetricGrid({ dashboard }: DashboardMetricGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={Building2} label="Restaurants" value={`${dashboard?.activeShops ?? 0}/${dashboard?.totalShops ?? 0}`} />
      <MetricCard icon={ClipboardList} label="Pending applications" value={dashboard?.pendingApplications ?? 0} />
      <MetricCard icon={ReceiptText} label="Orders" value={dashboard?.totalOrders ?? 0} />
      <MetricCard icon={BadgeDollarSign} label="Revenue" value={formatMoney(dashboard?.totalRevenueCent ?? 0)} />
    </div>
  )
}
