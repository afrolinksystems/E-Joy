import React from 'react'
import type { MerchantDispatchOrderRow } from '../graphql/merchantOrders'

function shortOrderId(id: string): string {
  return id.length <= 6 ? id : id.slice(-6)
}

export type KitchenReceiptProps = {
  order: MerchantDispatchOrderRow
}

/**
 * Root ref must attach to the printable node (no overflow-hidden / h-screen on this div).
 * Styles target this node directly so they survive react-to-print’s iframe clone.
 */
export const KitchenReceipt = React.forwardRef<HTMLDivElement, KitchenReceiptProps>(
  function KitchenReceipt({ order }, ref) {
    const tableDisplay = order.tableName?.trim() || '—'
    const when = new Date(order.createdAt).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return (
      <div
        ref={ref}
        className="box-border w-[80mm] max-w-[80mm] bg-white p-4 font-mono text-sm leading-tight text-black"
      >
        <h1 className="mb-1.5 border-b-2 border-black pb-1.5 text-center text-xs font-bold uppercase tracking-widest">
          Kitchen ticket
        </h1>
        <div className="my-2.5 border-[3px] border-black px-2 py-3 text-center">
          <p className="m-0 text-[10px] font-bold uppercase tracking-widest">
            Table
          </p>
          <p className="m-0 mt-2 text-[32px] font-extrabold leading-none">
            {tableDisplay}
          </p>
        </div>
        <div className="my-1 flex justify-between gap-2 text-[11px]">
          <span>Order ID</span>
          <span className="font-bold">#{shortOrderId(order.id)}</span>
        </div>
        <div className="my-1 flex justify-between gap-2 text-[11px]">
          <span>Order no.</span>
          <span className="font-semibold">{order.orderNo}</span>
        </div>
        <div className="my-1 flex justify-between gap-2 text-[11px]">
          <span>Time</span>
          <span className="font-semibold">{when}</span>
        </div>
        <div className="mt-2.5 flex justify-between border-b-2 border-black pb-1 text-[10px] font-bold uppercase tracking-wide">
          <span>Item</span>
          <span>Qty</span>
        </div>
        <ul className="m-0 list-none p-0">
          {order.items.map((line, idx) => (
            <li
              key={`${order.id}-r-${idx}`}
              className="flex items-baseline justify-between gap-2.5 border-b border-black py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 break-words">{line.productName}</span>
              <span className="min-w-[2.5em] shrink-0 text-right font-bold">
                ×{line.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  },
)

KitchenReceipt.displayName = 'KitchenReceipt'
