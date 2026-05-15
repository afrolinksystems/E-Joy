import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../../components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import type { GetOrdersData } from '../../../graphql/getOrders'
import { formatBirr } from '../customer-ordering.utils'
import { LoadingState } from './LoadingState'

type OrdersScreenProps = {
  loading: boolean
  onGoOrder: () => void
  onOpenOrder: (id: string) => void
  onRefresh: () => void
  orders: GetOrdersData['getOrders']
}

export function OrdersScreen({
  loading,
  onGoOrder,
  onOpenOrder,
  onRefresh,
  orders,
}: OrdersScreenProps) {
  const [orderMode, setOrderMode] = useState<'dine' | 'stored'>('dine')
  const visibleOrders = orderMode === 'dine' ? orders : []

  return (
    <section className="min-h-svh bg-card px-4 pb-28 pt-[calc(env(safe-area-inset-top)+18px)]">
      <header className="flex min-h-12 items-center justify-between">
        <h1 className="text-[25px] font-black">Orders</h1>
        <Button type="button" variant="ghost" onClick={onRefresh}>Refresh</Button>
      </header>
      <Tabs value={orderMode} onValueChange={(value) => setOrderMode(value as 'dine' | 'stored')} className="mt-3">
        <TabsList variant="line" className="h-11 gap-8">
          <TabsTrigger value="dine" className="text-[18px] font-black">Dine-in</TabsTrigger>
          <TabsTrigger value="stored" className="text-[18px] font-black">Stored value</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <LoadingState label="Loading orders" />
      ) : visibleOrders.length === 0 ? (
        <Empty className="min-h-[65svh] border-0">
          <EmptyHeader>
            <EmptyMedia>
              <ClipboardList className="size-20 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-[18px]">You do not have orders yet.</EmptyTitle>
            <EmptyDescription>Placed orders will show up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" className="h-12 w-[220px] rounded-full" onClick={onGoOrder}>
              Go order
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {visibleOrders.map((order) => (
            <Card key={order.id}>
              <button
                type="button"
                className="flex flex-col gap-2 p-4 text-left"
                onClick={() => onOpenOrder(order.id)}
              >
                <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</span>
                <strong className="text-[21px] font-black">{formatBirr(order.totalAmount)}</strong>
                <p className="m-0 text-sm text-muted-foreground">{order.items.length} items - {order.status}</p>
              </button>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
