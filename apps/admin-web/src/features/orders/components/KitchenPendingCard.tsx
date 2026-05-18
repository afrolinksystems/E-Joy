import { ChefHat, Printer } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { canPrintKitchenTicket } from '../../printing/printing.utils'
import { formatBirr, formatRelativeEn, shortId } from '../orders.utils'

type KitchenPendingCardProps = {
  mutating: boolean
  order: MerchantDispatchOrderRow
  onAccept: (order: MerchantDispatchOrderRow) => void
  onCancel: (order: MerchantDispatchOrderRow) => void
  onPrintKitchen: (order: MerchantDispatchOrderRow) => void
}

export function KitchenPendingCard({
  mutating,
  order,
  onAccept,
  onCancel,
  onPrintKitchen,
}: KitchenPendingCardProps) {
  return (
    <div className="animate-pulse rounded-xl border-2 border-red-200 bg-white p-4 shadow-[0_0_16px_rgba(239,68,68,0.25)] ring-1 ring-red-300/60">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-lg font-bold text-slate-900">
          #{shortId(order.id)}
        </span>
        <span className="text-xs font-semibold uppercase text-amber-700">
          Pending
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {formatRelativeEn(order.createdAt)} · {formatBirr(order.totalAmount)}
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((line, idx) => (
          <li
            key={`${order.id}-${idx}`}
            className={
              line.quantity > 1 ? 'font-bold text-red-600' : 'text-slate-800'
            }
          >
            {line.quantity}× {line.productName}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={mutating}
          onClick={() => onAccept(order)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <ChefHat className="h-3.5 w-3.5" />
          Accept &amp; prepare
        </button>
        {canPrintKitchenTicket(order) ? (
          <button
            type="button"
            onClick={() => onPrintKitchen(order)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            <Printer className="h-3.5 w-3.5" />
            Print to kitchen
          </button>
        ) : null}
        <button
          type="button"
          disabled={mutating}
          onClick={() => onCancel(order)}
          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

