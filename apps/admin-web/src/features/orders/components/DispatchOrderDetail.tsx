import { CheckCircle2, ChefHat, Package, Printer, XCircle } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { canPrintKitchenTicket } from '../../printing/printing.utils'
import type { OrderStatusAction } from '../orders.types'
import { formatBirr, formatRelativeEn } from '../orders.utils'

type DispatchOrderDetailProps = {
  mutating: boolean
  selected: MerchantDispatchOrderRow | null
  onPrintKitchen: (order: MerchantDispatchOrderRow) => void
  onStatus: (order: MerchantDispatchOrderRow, status: OrderStatusAction) => void
}

export function DispatchOrderDetail({
  mutating,
  selected,
  onPrintKitchen,
  onStatus,
}: DispatchOrderDetailProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Order detail</h2>
      </div>
      {!selected ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
          Select an order from the list.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-500">Order No.</span>
              <span className="font-mono font-medium text-slate-900">
                {selected.orderNo}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-slate-500">Shop </span>
                <span className="text-slate-800">{selected.shopName}</span>
              </div>
              <div>
                <span className="text-slate-500">Table </span>
                <span className="text-slate-800">
                  {selected.tableName?.trim() || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Placed </span>
                <span className="text-slate-800">
                  {formatRelativeEn(selected.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total </span>
                <span className="font-semibold text-slate-900">
                  {formatBirr(selected.totalAmount)}
                </span>
              </div>
            </div>
          </div>
          <div className="px-4 py-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Package className="h-4 w-4" />
              Line items
            </h3>
            <ul className="space-y-3">
              {selected.items.map((line, idx) => (
                <li
                  key={`${selected.id}-${idx}-${line.productName}`}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">
                      {line.productName}
                    </div>
                    <div
                      className={
                        line.quantity > 1
                          ? 'text-sm font-bold text-red-600'
                          : 'text-xs text-slate-500'
                      }
                    >
                      × {line.quantity}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto border-t border-slate-100 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {selected.status === 'PENDING' ? (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onStatus(selected, 'PREPARING')}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  <ChefHat className="h-4 w-4" />
                  Accept &amp; prepare
                </button>
              ) : null}
              {canPrintKitchenTicket(selected) ? (
                <button
                  type="button"
                  onClick={() => onPrintKitchen(selected)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  Print to kitchen
                </button>
              ) : null}
              {selected.status === 'PREPARING' ? (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onStatus(selected, 'COMPLETED')}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as completed
                </button>
              ) : null}
              {selected.status !== 'COMPLETED' &&
              selected.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => onStatus(selected, 'CANCELLED')}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel order
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

