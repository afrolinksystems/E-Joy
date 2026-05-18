import { Package, Printer, X } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import type { TableRow } from '../../../graphql/tables'
import { canPrintKitchenTicket } from '../../printing/printing.utils'
import { formatBirr, formatTime } from '../tables.utils'

type TableDetailPanelProps = {
  ordersForSelectedTable: MerchantDispatchOrderRow[]
  primaryOrder: MerchantDispatchOrderRow | null
  selected: TableRow | null
  onClose: () => void
  onPrintKitchen: (order: MerchantDispatchOrderRow) => void
}

export function TableDetailPanel({
  ordersForSelectedTable,
  primaryOrder,
  selected,
  onClose,
  onPrintKitchen,
}: TableDetailPanelProps) {
  return (
    <aside
      className={[
        'w-full shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all lg:w-[380px]',
        selected ? 'opacity-100' : 'opacity-90',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Table detail</h2>
        {selected ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="max-h-[min(80vh,720px)] overflow-y-auto p-4">
        {!selected ? (
          <p className="text-sm text-slate-500">
            Select a table on the floor plan to view the active order linked to
            that table number (from dispatch data).
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Table
              </div>
              <div className="text-xl font-bold text-slate-900">
                {selected.tableNumber}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Status:{' '}
                <span className="font-semibold text-slate-800">
                  {selected.status}
                </span>
                {' · '}
                Seats {selected.capacity}
              </div>
            </div>
            {!primaryOrder ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No open order matches this table in the current dispatch queue.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {primaryOrder.orderNo}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold uppercase text-blue-900">
                    {primaryOrder.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Placed {formatTime(primaryOrder.createdAt ?? '')}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  Total {formatBirr(primaryOrder.totalAmount ?? 0)}
                </div>
                <h3 className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Package className="h-3.5 w-3.5" />
                  Items
                </h3>
                <ul className="mt-2 space-y-2">
                  {(primaryOrder.items ?? []).map((line, idx) => (
                    <li
                      key={`${primaryOrder.id}-${idx}`}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 text-slate-800">
                        {line.productName}
                      </span>
                      <span
                        className={
                          (line.quantity ?? 0) > 1
                            ? 'font-bold text-red-600'
                            : 'font-medium text-slate-700'
                        }
                      >
                        ×{line.quantity ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
                {canPrintKitchenTicket(primaryOrder) ? (
                  <button
                    type="button"
                    onClick={() => onPrintKitchen(primaryOrder)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    Print to kitchen
                  </button>
                ) : null}
                {ordersForSelectedTable.length > 1 ? (
                  <p className="mt-3 text-xs text-amber-800">
                    {ordersForSelectedTable.length - 1} additional open order(s)
                    at this table — showing the most recent.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

