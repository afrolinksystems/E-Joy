import { Loader2 } from 'lucide-react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { KitchenPendingCard } from './KitchenPendingCard'
import { KitchenPreparingTicket } from './KitchenPreparingTicket'

type KitchenViewProps = {
  loading: boolean
  mutating: boolean
  pendingOrders: MerchantDispatchOrderRow[]
  preparingOrders: MerchantDispatchOrderRow[]
  onAccept: (order: MerchantDispatchOrderRow) => void
  onCancel: (order: MerchantDispatchOrderRow) => void
  onComplete: (order: MerchantDispatchOrderRow) => void
  onPrintKitchen: (order: MerchantDispatchOrderRow) => void
}

export function KitchenView({
  loading,
  mutating,
  pendingOrders,
  preparingOrders,
  onAccept,
  onCancel,
  onComplete,
  onPrintKitchen,
}: KitchenViewProps) {
  if (loading && pendingOrders.length === 0 && preparingOrders.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading kitchen queue…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Awaiting acceptance
        </h2>
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No new tickets.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((order) => (
              <KitchenPendingCard
                key={order.id}
                mutating={mutating}
                order={order}
                onAccept={onAccept}
                onCancel={onCancel}
                onPrintKitchen={onPrintKitchen}
              />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          In preparation (kitchen tickets)
        </h2>
        {preparingOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No orders on the line.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {preparingOrders.map((order) => (
              <KitchenPreparingTicket
                key={order.id}
                mutating={mutating}
                order={order}
                onComplete={onComplete}
                onPrintKitchen={onPrintKitchen}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

