import { useQuery } from '@apollo/client/react'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { GET_ORDERS_QUERY, type GetOrdersData, type OrderHistoryRow } from '../graphql/getOrders'

const PLACEHOLDER_IMG =
  'https://www.figma.com/api/mcp/asset/30a5f704-118c-4ab5-814f-08f4c7afa4eb'

/** 与 Vite 环境变量对齐；上传相对路径时拼到 order-service 源站 */
function resolveProductImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return PLACEHOLDER_IMG
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  const origin =
    import.meta.env.VITE_ORDER_SERVICE_ORIGIN?.replace(/\/$/, '') ?? 'http://localhost:9602'
  const path = u.startsWith('/') ? u : `/${u}`
  return `${origin}${path}`
}

/** 水印章用短英文，避免 ENUM 过长换行 */
function stampLabel(status: string): string {
  const s = status.toUpperCase()
  const map: Record<string, string> = {
    COMPLETED: 'DONE',
    PAID: 'PAID',
    PREPARING: 'COOKING',
    READY: 'READY',
    PENDING_PAYMENT: 'PENDING',
    DRAFT: 'DRAFT',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    PAYMENT_FAILED: 'FAILED',
  }
  return map[s] ?? s.replace(/_/g, ' ').slice(0, 14)
}

type OrdersPageProps = {
  onBack?: () => void
  onOpenOrderDetail?: (id: string) => void
}

function OrderCard({
  order,
  onOpenDetail,
}: {
  order: OrderHistoryRow
  onOpenDetail?: (id: string) => void
}) {
  const totalQty = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const showEllipsis = order.items.length > 3

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <button
            type="button"
            className="flex items-center text-lg font-bold text-gray-800"
            onClick={(e) => e.preventDefault()}
          >
            E-Joy Kitchen
            <ChevronRight size={18} className="text-gray-400" aria-hidden />
          </button>
          <div className="mt-1 text-xs text-gray-400">
            {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
          </div>
        </div>
        <span className="text-sm font-medium uppercase text-gray-500">{order.status}</span>
      </div>

      <div
        className="pointer-events-none absolute right-4 top-2 rotate-12 select-none rounded-lg border-4 border-gray-900 px-2 py-1 opacity-10"
        aria-hidden
      >
        <span className="text-2xl font-black uppercase">{stampLabel(order.status)}</span>
      </div>

      <div className="flex space-x-3 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {order.items.map((item, idx) => (
          <div key={`${order.id}-${idx}-${item.product.name}`} className="w-20 flex-shrink-0 text-center">
            <img
              src={resolveProductImageUrl(item.product.imageUrl)}
              alt={item.product.name}
              className="h-20 w-20 rounded-xl bg-gray-100 object-cover"
            />
            <p className="mt-1 truncate text-[10px] text-gray-500">{item.product.name}</p>
          </div>
        ))}
        {showEllipsis ? (
          <div className="flex h-20 w-12 flex-shrink-0 items-center justify-center text-gray-300">…</div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-50 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="text-sm text-gray-400">
            Total {order.items.length} line(s) · {totalQty} pc(s)
          </div>
          <div className="text-right font-bold text-gray-900">
            {(order.totalAmount / 100).toFixed(2)} Birr
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="rounded-full border border-gray-200 px-5 py-1.5 text-sm font-medium text-gray-600 active:bg-gray-50"
            onClick={() => onOpenDetail?.(order.id)}
          >
            Details
          </button>
          <button
            type="button"
            className="rounded-full border border-orange-500 px-5 py-1.5 text-sm font-medium text-orange-500 active:bg-orange-50"
          >
            Reorder
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage({ onBack, onOpenOrderDetail }: OrdersPageProps) {
  const { data, loading, error, refetch } = useQuery<GetOrdersData>(GET_ORDERS_QUERY, {
    fetchPolicy: 'network-only',
  })

  const orders = data?.getOrders ?? []

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="border-b border-gray-100 bg-white px-4 pt-3">
        <div className="mx-auto flex max-w-lg items-center justify-between pb-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-800"
              aria-label="Back"
            >
              ←
            </button>
          ) : (
            <div className="w-10" />
          )}
          <h1 className="text-lg font-bold text-gray-900">Orders</h1>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-semibold text-orange-500"
          >
            Refresh
          </button>
        </div>
        <div className="mx-auto flex max-w-lg space-x-8 border-b border-gray-100">
          <div className="border-b-2 border-orange-500 pb-2 font-bold text-gray-900">Ordering</div>
          <div className="cursor-default pb-2 text-gray-400">Wallet</div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading your feast…</div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            Failed to load orders: {error.message}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders yet.</div>
        ) : (
          orders.map((o) => (
            <OrderCard key={o.id} order={o} onOpenDetail={onOpenOrderDetail} />
          ))
        )}
      </div>
    </div>
  )
}
