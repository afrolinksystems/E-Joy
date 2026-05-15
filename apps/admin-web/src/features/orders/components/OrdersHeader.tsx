import { ClipboardList } from 'lucide-react'
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Order dispatch
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shop <span className="font-mono font-semibold">{shopId}</span>
          {' · '}
          Refresh every {pollMs / 1000}s
          {' · '}
          <span className="font-medium text-orange-600">
            {pendingCount} pending
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <OrderModeToggle value={kitchenView} onChange={onViewChange} />
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ClipboardList className="h-4 w-4" />
          Refresh now
        </button>
      </div>
    </div>
  )
}

