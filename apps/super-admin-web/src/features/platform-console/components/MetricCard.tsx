import type { LucideIcon } from 'lucide-react'

type MetricCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
}

export function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <Icon size={20} className="text-blue-600" />
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </section>
  )
}
