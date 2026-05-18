import { Loader2 } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { formatBirr, formatRelativeEn, orderStatusClass, shortId } from '../orders.utils'

type DispatchOrderListProps = {
  loading: boolean
  orders: MerchantDispatchOrderRow[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function DispatchOrderList({
  loading,
  orders,
  selectedId,
  onSelect,
}: DispatchOrderListProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Orders</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No orders in the queue.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => onSelect(order.id)}
                  className={[
                    'flex w-full flex-col gap-1 px-4 py-3 text-left transition',
                    selectedId === order.id
                      ? 'border-l-4 border-orange-500 bg-orange-50/80'
                      : 'border-l-4 border-transparent hover:bg-slate-50',
                    order.status === 'PENDING'
                      ? 'animate-pulse shadow-[inset_0_0_12px_rgba(239,68,68,0.12)]'
                      : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      #{shortId(order.id)}
                    </span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                        orderStatusClass(order.status),
                      ].join(' ')}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatRelativeEn(order.createdAt)}</span>
                    <span className="font-semibold text-slate-800">
                      {formatBirr(order.totalAmount)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

