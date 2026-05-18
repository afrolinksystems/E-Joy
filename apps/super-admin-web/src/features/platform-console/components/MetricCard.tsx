import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'

type MetricCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
}

export function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">{label}</span>
          <Icon className="text-primary" />
        </div>
        <div className="mt-3 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
