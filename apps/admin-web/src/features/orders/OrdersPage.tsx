import { AlertCircle } from 'lucide-react'
import { DispatchOrderDetail } from './components/DispatchOrderDetail'
import { DispatchOrderList } from './components/DispatchOrderList'
import { HiddenKitchenReceipt } from './components/HiddenKitchenReceipt'
import { KitchenView } from './components/KitchenView'
import { OrdersHeader } from './components/OrdersHeader'
import { useMerchantOrders } from './hooks/useMerchantOrders'

export function OrdersPage() {
  const state = useMerchantOrders()
  const { requestKitchenPrint } = state.printState

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-4">
      <HiddenKitchenReceipt printState={state.printState} />
      <OrdersHeader
        kitchenView={state.kitchenView}
        pendingCount={state.pendingOrders.length}
        pollMs={state.pollMs}
        shopId={state.shopId}
        onRefresh={() => void state.refetch()}
        onViewChange={state.setKitchenView}
      />
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error.message}
        </div>
      ) : null}
      {state.kitchenView ? (
        <KitchenView
          loading={state.loading}
          mutating={state.mutating}
          pendingOrders={state.pendingOrders}
          preparingOrders={state.preparingOrders}
          onAccept={(order) => void state.runStatus(order, 'PREPARING')}
          onCancel={(order) => void state.runStatus(order, 'CANCELLED')}
          onComplete={(order) => void state.runStatus(order, 'COMPLETED')}
          onPrintKitchen={requestKitchenPrint}
        />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
          <DispatchOrderList
            loading={state.loading}
            orders={state.orders}
            selectedId={state.selectedId}
            onSelect={state.setSelectedId}
          />
          <DispatchOrderDetail
            mutating={state.mutating}
            selected={state.selected}
            onPrintKitchen={requestKitchenPrint}
            onStatus={(order, status) => void state.runStatus(order, status)}
          />
        </div>
      )}
    </div>
  )
}

