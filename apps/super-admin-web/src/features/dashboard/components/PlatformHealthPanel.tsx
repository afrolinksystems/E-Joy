import { HealthRow } from '../../platform-console/components/HealthRow'
import type { Dashboard } from '../dashboard.types'

type PlatformHealthPanelProps = {
  dashboard?: Dashboard
}

export function PlatformHealthPanel({ dashboard }: PlatformHealthPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold">Platform health</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <HealthRow label="Paid orders" value={dashboard?.paidOrders ?? 0} tone="green" />
        <HealthRow label="Failed payments" value={dashboard?.failedPayments ?? 0} tone="red" />
        <HealthRow label="Application backlog" value={dashboard?.pendingApplications ?? 0} tone="blue" />
      </div>
    </section>
  )
}
