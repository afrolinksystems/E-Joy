import { useQuery } from '@apollo/client/react'
import { format } from 'date-fns'
import { ArrowLeft, Copy, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { GET_ORDER_QUERY, type OrderDetailData } from '../graphql/getOrder'
import { getCustomerThemeVars } from '../lib/customerTheme'
import { buildMockTelebirrRedirectUrl } from '../lib/mockTelebirrRedirectUrl'

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

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = status.toUpperCase()
  if (normalized === 'CANCELLED') return 'destructive'
  if (normalized === 'COMPLETED' || normalized === 'PAID') return 'default'
  if (orderNeedsPayment(status)) return 'secondary'
  return 'outline'
}

function copyToClipboard(text: string): void {
  void navigator.clipboard.writeText(text).then(
    () => toast.success('Order number copied'),
    () => {
      window.prompt('Copy order number:', text)
    },
  )
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
      window.location.href = buildMockTelebirrRedirectUrl(order.id, order.totalAmount)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Telebirr payment failed')
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-svh max-w-[480px] place-items-center bg-background text-foreground" style={getCustomerThemeVars()}>
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Spinner />
          Loading order
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="mx-auto min-h-svh max-w-[480px] bg-background pb-28 text-foreground" style={getCustomerThemeVars()}>
        <DetailTopbar title="Order" onBack={onBack} />
        <section className="p-4">
          <Empty className="min-h-[70svh] bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle className="text-lg">Order not found</EmptyTitle>
              <EmptyDescription>{error?.message ?? 'This order could not be loaded.'}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" className="h-11 rounded-full" onClick={() => void refetch()}>
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-svh max-w-[480px] bg-background pb-[calc(112px+env(safe-area-inset-bottom))] text-foreground" style={getCustomerThemeVars()}>
      <DetailTopbar title="Order Status" onBack={onBack} />

      <div className="flex flex-col gap-3 p-3">
        <Card>
          <CardHeader>
            <Badge className="w-fit" variant={statusVariant(order.status)}>
              {statusLabel(order.status)}
            </Badge>
            <CardTitle className="text-[21px] font-black">{order.shopName}</CardTitle>
            <CardDescription>{order.tableName ? `Table ${order.tableName}` : 'Dine-in order'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-muted p-3">
              <span className="min-w-0 break-words font-mono text-xs text-muted-foreground">{order.orderNo}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => copyToClipboard(order.orderNo)}>
                <Copy data-icon="inline-start" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[17px] font-black">Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            {order.items.map((item, index) => (
              <div key={`${order.id}-${index}`}>
                <article className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <img
                    src={resolveProductImageUrl(item.product.imageUrl)}
                    alt=""
                    className="size-[62px] rounded-lg bg-muted object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-black">{item.product.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <strong className="whitespace-nowrap text-sm font-black">{formatBirr(item.priceAtTime * item.quantity)}</strong>
                </article>
                {index < order.items.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[17px] font-black">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3">
              <DetailMeta label="Placed" value={format(new Date(order.createdAt), 'MMM d, HH:mm')} />
              <DetailMeta label="Payment" value="Telebirr" />
              <DetailMeta label="Total" value={formatBirr(order.totalAmount)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {needsPayment ? (
        <footer className="fixed bottom-0 left-1/2 z-20 grid w-[min(480px,100vw)] -translate-x-1/2 grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] items-center gap-3 border-t bg-card/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-14px_30px_rgba(20,20,20,0.08)] backdrop-blur">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">Total</span>
            <strong className="mt-0.5 block text-[17px] font-black">{formatBirr(order.totalAmount)}</strong>
          </div>
          <Button type="button" className="min-h-12 rounded-full font-black" onClick={payWithTelebirr}>
            Pay with Telebirr
          </Button>
        </footer>
      ) : (
        <div className="px-3">
          <Alert>
            <AlertTitle>Payment status</AlertTitle>
            <AlertDescription>This order does not need payment action right now.</AlertDescription>
          </Alert>
        </div>
      )}
    </main>
  )
}

function DetailTopbar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="sticky top-0 z-10 grid grid-cols-[44px_1fr_44px] items-center gap-2 bg-background/95 px-3 py-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
      <Button type="button" variant="ghost" size="icon-lg" className="rounded-full" onClick={onBack} aria-label="Back">
        <ArrowLeft />
      </Button>
      <h1 className="text-center text-[18px] font-black">{title}</h1>
      <span />
    </header>
  )
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 text-right font-bold">{value}</dd>
    </div>
  )
}
