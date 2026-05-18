type DashboardMetricCardProps = {
  className?: string
  label: string
  value: string
}

export function DashboardMetricCard({ className = '', label, value }: DashboardMetricCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  )
}
