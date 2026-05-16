import { ClipboardList } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { OrderModeToggle } from './OrderModeToggle'

type OrdersHeaderProps = {
  kitchenView: boolean
  pendingCount: number
  pollMs: number
  shopId: string | null
  onRefresh: () => void
  onViewChange: (value: boolean) => void
}

export function OrdersHeader({
  kitchenView,
  pendingCount,
  pollMs,
  shopId,
  onRefresh,
  onViewChange,
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order dispatch</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Shop <span className="font-mono font-semibold text-foreground">{shopId}</span></span>
          <span>Refresh every {pollMs / 1000}s</span>
          <Badge variant="secondary">{pendingCount} pending</Badge>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <OrderModeToggle value={kitchenView} onChange={onViewChange} />
        <Button type="button" variant="outline" onClick={onRefresh}>
          <ClipboardList data-icon="inline-start" />
          Refresh now
        </Button>
      </div>
    </div>
  )
}
