import { useQuery } from '@apollo/client/react'
import { format } from 'date-fns'
import { ArrowLeft, Copy, Loader2, ReceiptText } from 'lucide-react'
import { GET_ORDER_QUERY, type OrderDetailData } from '../graphql/getOrder'
import { buildMockTelebirrRedirectUrl } from '../lib/mockTelebirrRedirectUrl'
import { useToastStore } from '../store/useToastStore'

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=320&q=80'

type OrderDetailPageProps = {
  orderId: string
  onBack: () => void
}

function formatBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

function resolveProductImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return PLACEHOLDER_IMG
  const value = url.trim()
  if (/^https?:\/\//i.test(value)) return value
  const origin =
    import.meta.env.VITE_ORDER_SERVICE_ORIGIN?.replace(/\/$/, '') ?? 'http://localhost:9602'
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`
}

function orderNeedsPayment(status: string): boolean {
  const normalized = status.toUpperCase()
  return normalized === 'PENDING_PAYMENT' || normalized === 'DRAFT' || normalized === 'PENDING'
}

function statusLabel(status: string): string {
  const normalized = status.toUpperCase()
  if (normalized === 'COMPLETED') return 'Completed'
  if (normalized === 'CANCELLED') return 'Cancelled'
  if (normalized === 'READY') return 'Ready for pickup'
  if (normalized === 'PREPARING') return 'Preparing'
  if (normalized === 'PAID') return 'Paid'
  if (orderNeedsPayment(status)) return 'Waiting for Telebirr payment'
  return 'Order received'
}

function copyToClipboard(text: string): void {
  void navigator.clipboard.writeText(text).catch(() => {
    window.prompt('Copy order number:', text)
  })
}

export default function OrderDetailPage({ orderId, onBack }: OrderDetailPageProps) {
  const { data, loading, error, refetch } = useQuery<OrderDetailData>(GET_ORDER_QUERY, {
    variables: { id: orderId },
    skip: !orderId,
    fetchPolicy: 'network-only',
  })

  const order = data?.getOrder ?? null
  const needsPayment = order ? orderNeedsPayment(order.status) : false

  function payWithTelebirr() {
    if (!order?.id) return
    try {
      window.location.href = buildMockTelebirrRedirectUrl(order.id)
    } catch (err) {
      useToastStore
        .getState()
        .show(err instanceof Error ? err.message : 'Telebirr payment failed', 'error')
    }
  }

  if (loading) {
    return (
      <main className="detail-page">
        <div className="detail-loading">
          <Loader2 size={22} className="spin" />
          Loading order
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="detail-page">
        <header className="detail-topbar">
          <button type="button" className="icon-circle" onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1>Order</h1>
          <span />
        </header>
        <section className="empty-panel detail-error">
          <ReceiptText size={42} />
          <h2>Order not found</h2>
          <p>{error?.message ?? 'This order could not be loaded.'}</p>
          <button type="button" className="primary-pill" onClick={() => void refetch()}>
            Retry
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="detail-page">
      <header className="detail-topbar">
        <button type="button" className="icon-circle" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1>Order Status</h1>
        <span />
      </header>

      <section className="detail-status-card">
        <span className="status-pill">{statusLabel(order.status)}</span>
        <h2>{order.shopName}</h2>
        <p>{order.tableName ? `Table ${order.tableName}` : 'Dine-in order'}</p>
        <div className="order-number-row">
          <span>{order.orderNo}</span>
          <button type="button" onClick={() => copyToClipboard(order.orderNo)}>
            <Copy size={14} />
            Copy
          </button>
        </div>
      </section>

      <section className="detail-card">
        <h2>Items</h2>
        <div className="detail-item-list">
          {order.items.map((item, index) => (
            <article key={`${order.id}-${index}`} className="detail-item">
              <img src={resolveProductImageUrl(item.product.imageUrl)} alt="" />
              <div>
                <h3>{item.product.name}</h3>
                <p>x{item.quantity}</p>
              </div>
              <strong>{formatBirr(item.priceAtTime * item.quantity)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-card detail-meta">
        <h2>Details</h2>
        <dl>
          <div>
            <dt>Placed</dt>
            <dd>{format(new Date(order.createdAt), 'MMM d, HH:mm')}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>Telebirr</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatBirr(order.totalAmount)}</dd>
          </div>
        </dl>
      </section>

      {needsPayment ? (
        <footer className="detail-paybar">
          <div>
            <span>Total</span>
            <strong>{formatBirr(order.totalAmount)}</strong>
          </div>
          <button type="button" className="pay-button" onClick={payWithTelebirr}>
            Pay with Telebirr
          </button>
        </footer>
      ) : null}
    </main>
  )
}
