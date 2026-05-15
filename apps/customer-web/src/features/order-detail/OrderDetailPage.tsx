import { format } from 'date-fns'
import { Copy, ReceiptText } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty'
import { Spinner } from '../../components/ui/spinner'
import { getCustomerThemeVars } from '../../lib/customerTheme'
import { DetailMeta } from './components/DetailMeta'
import { DetailTopbar } from './components/DetailTopbar'
import { OrderItemList } from './components/OrderItemList'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { PaymentActions } from './components/PaymentActions'
import { useOrderDetail } from './hooks/useOrderDetail'
import type { OrderDetailPageProps } from './order-detail.types'
import { copyOrderNumber, formatOrderBirr } from './order-detail.utils'

export function OrderDetailPage({ orderId, onBack }: OrderDetailPageProps) {
  const { error, loading, needsPayment, order, payWithTelebirr, refetch } =
    useOrderDetail(orderId)

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
            <OrderStatusBadge status={order.status} />
            <CardTitle className="text-[21px] font-black">{order.shopName}</CardTitle>
            <CardDescription>{order.tableName ? `Table ${order.tableName}` : 'Dine-in order'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-muted p-3">
              <span className="min-w-0 break-words font-mono text-xs text-muted-foreground">{order.orderNo}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => copyOrderNumber(order.orderNo)}>
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
          <CardContent>
            <OrderItemList orderId={order.id} items={order.items} />
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
              <DetailMeta label="Total" value={formatOrderBirr(order.totalAmount)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <PaymentActions
        needsPayment={needsPayment}
        onPay={payWithTelebirr}
        totalAmount={order.totalAmount}
      />
    </main>
  )
}
