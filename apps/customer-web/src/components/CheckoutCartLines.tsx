import { useCartStore } from '../store/useCartStore'

/**
 * Checkout cart lines: [-][qty][+] and remove; wired to Zustand only.
 */
export function CheckoutCartLines() {
  const items = useCartStore((s) => s.items)
  const incrementItem = useCartStore((s) => s.incrementItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const deleteItem = useCartStore((s) => s.deleteItem)

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">Your cart is empty.</p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const lineTotalBirr = (item.price * item.quantity) / 100
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/50"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {(item.price / 100).toFixed(0)} Birr / each
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-0.5 py-0.5 dark:border-slate-600 dark:bg-slate-900">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600"
                onClick={() => removeItem(item.id)}
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600"
                onClick={() => incrementItem(item.id)}
              >
                +
              </button>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums text-[#e67e22]">{lineTotalBirr.toFixed(0)} Birr</span>
              <button
                type="button"
                aria-label="Remove from cart"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                onClick={() => deleteItem(item.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
