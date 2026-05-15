import { CheckCircle2, Printer } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { canPrintKitchenTicket } from '../../printing/printing.utils'
import { shortId } from '../orders.utils'

type KitchenPreparingTicketProps = {
  mutating: boolean
  order: MerchantDispatchOrderRow
  onComplete: (order: MerchantDispatchOrderRow) => void
  onPrintKitchen: (order: MerchantDispatchOrderRow) => void
}

export function KitchenPreparingTicket({
  mutating,
  order,
  onComplete,
  onPrintKitchen,
}: KitchenPreparingTicketProps) {
  return (
    <div className="relative rounded-lg border-2 border-dashed border-slate-900 bg-amber-50/40 p-5 font-mono shadow-inner">
      <div className="border-b-2 border-slate-900 pb-3 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-600">
          {order.shopName}
        </div>
        <div className="mt-1 text-2xl font-black tabular-nums text-slate-900">
          #{shortId(order.id)}
        </div>
        <div className="mt-2 text-sm text-slate-700">
          Table:{' '}
          <span className="font-semibold">{order.tableName?.trim() || '—'}</span>
        </div>
        <div className="text-xs text-slate-500">
          {new Date(order.createdAt).toLocaleString('en-GB')}
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {order.items.map((line, idx) => (
          <li
            key={`${order.id}-k-${idx}`}
            className="flex justify-between gap-3 border-b border-slate-200/80 pb-2 last:border-0"
          >
            <span className="min-w-0 flex-1 text-slate-900">
              {line.productName}
            </span>
            <span
              className={
                line.quantity > 1
                  ? 'font-bold text-red-600'
                  : 'font-medium text-slate-800'
              }
            >
              ×{line.quantity}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-slate-900 pt-4">
        {canPrintKitchenTicket(order) ? (
          <button
            type="button"
            onClick={() => onPrintKitchen(order)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            <Printer className="h-3.5 w-3.5" />
            Print to kitchen
          </button>
        ) : null}
        <button
          type="button"
          disabled={mutating}
          onClick={() => onComplete(order)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done
        </button>
      </div>
    </div>
  )
}

