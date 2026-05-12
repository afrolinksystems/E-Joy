import { useMutation, useQuery } from '@apollo/client/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  LayoutList,
  Loader2,
  MonitorPlay,
  Package,
  Printer,
  XCircle,
} from 'lucide-react'
import {
  MERCHANT_DISPATCH_ORDERS,
  UPDATE_ORDER_STATUS,
  type MerchantDispatchData,
  type MerchantDispatchOrderRow,
} from '../graphql/merchantOrders'
import { KitchenReceipt } from '../components/KitchenReceipt'
import {
  canPrintKitchenTicket,
  useKitchenPrint,
} from '../lib/kitchenPrint'
import { useAdminSession } from '../lib/adminSession'

const POLL_DISPATCH_MS = 5000
const POLL_KITCHEN_MS = 3000

const CHIME_URL =
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

function formatBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

function formatRelativeEn(iso: string): string {
  const t = new Date(iso).getTime()
  const diffSec = Math.round((Date.now() - t) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 48) return `${diffHr}h ago`
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function shortId(id: string): string {
  return id.length <= 6 ? id : id.slice(-6)
}

export function OrdersPage() {
  const { shopId } = useAdminSession()
  const [kitchenView, setKitchenView] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { kitchenPrintRef, orderToPrint, requestKitchenPrint } = useKitchenPrint()
  const prevPendingIdsRef = useRef<Set<string>>(new Set())
  const audioHydratedRef = useRef(false)

  const pollMs = kitchenView ? POLL_KITCHEN_MS : POLL_DISPATCH_MS

  const { data, loading, error, refetch } = useQuery<MerchantDispatchData>(
    MERCHANT_DISPATCH_ORDERS,
    {
      variables: { shopId },
      pollInterval: pollMs,
      fetchPolicy: 'network-only',
    },
  )

  const orders = data?.merchantDispatchOrders ?? []

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDING'),
    [orders],
  )

  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PREPARING'),
    [orders],
  )

  useEffect(() => {
    const pendingIds = new Set(
      orders.filter((o) => o.status === 'PENDING').map((o) => o.id),
    )
    if (!audioHydratedRef.current) {
      audioHydratedRef.current = true
      prevPendingIdsRef.current = pendingIds
      return
    }
    const prev = prevPendingIdsRef.current
    for (const id of pendingIds) {
      if (!prev.has(id)) {
        try {
          const audio = new Audio(CHIME_URL)
          void audio.play()
        } catch {
          /* autoplay blocked */
        }
        break
      }
    }
    prevPendingIdsRef.current = pendingIds
  }, [orders])

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  )

  useEffect(() => {
    if (!selectedId && orders.length > 0) {
      setSelectedId(orders[0].id)
    }
  }, [orders, selectedId])

  const [mutate, { loading: mutating }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => void refetch(),
  })

  async function runStatus(
    order: MerchantDispatchOrderRow,
    status: 'PREPARING' | 'COMPLETED' | 'CANCELLED',
  ) {
    await mutate({
      variables: { id: order.id, status, shopId },
    })
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[480px] flex-col gap-4">
      <div style={{ display: 'none' }} aria-hidden>
        {orderToPrint ? (
          <KitchenReceipt ref={kitchenPrintRef} order={orderToPrint} />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Order dispatch
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Shop <span className="font-mono font-semibold">{shopId}</span>
            {' · '}
            Refresh every {pollMs / 1000}s
            {' · '}
            <span className="font-medium text-orange-600">
              {pendingOrders.length} pending
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setKitchenView(false)}
              className={[
                'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                !kitchenView
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <LayoutList className="h-4 w-4" />
              Dispatch
            </button>
            <button
              type="button"
              onClick={() => setKitchenView(true)}
              className={[
                'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
                kitchenView
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <MonitorPlay className="h-4 w-4" />
              Kitchen view
            </button>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ClipboardList className="h-4 w-4" />
            Refresh now
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      ) : null}

      {kitchenView ? (
        <KitchenViewBody
          loading={loading}
          pendingOrders={pendingOrders}
          preparingOrders={preparingOrders}
          mutating={mutating}
          onAccept={(o) => void runStatus(o, 'PREPARING')}
          onComplete={(o) => void runStatus(o, 'COMPLETED')}
          onCancel={(o) => void runStatus(o, 'CANCELLED')}
          onPrintKitchen={requestKitchenPrint}
        />
      ) : (
        <DispatchViewBody
          orders={orders}
          loading={loading}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selected={selected}
          mutating={mutating}
          runStatus={runStatus}
          onPrintKitchen={requestKitchenPrint}
        />
      )}
    </div>
  )
}

function KitchenViewBody({
  loading,
  pendingOrders,
  preparingOrders,
  mutating,
  onAccept,
  onComplete,
  onCancel,
  onPrintKitchen,
}: {
  loading: boolean
  pendingOrders: MerchantDispatchOrderRow[]
  preparingOrders: MerchantDispatchOrderRow[]
  mutating: boolean
  onAccept: (o: MerchantDispatchOrderRow) => void
  onComplete: (o: MerchantDispatchOrderRow) => void
  onCancel: (o: MerchantDispatchOrderRow) => void
  onPrintKitchen: (o: MerchantDispatchOrderRow) => void
}) {
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
            {pendingOrders.map((o) => (
              <div
                key={o.id}
                className="animate-pulse rounded-xl border-2 border-red-200 bg-white p-4 shadow-[0_0_16px_rgba(239,68,68,0.25)] ring-1 ring-red-300/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-lg font-bold text-slate-900">
                    #{shortId(o.id)}
                  </span>
                  <span className="text-xs font-semibold uppercase text-amber-700">
                    Pending
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatRelativeEn(o.createdAt)} · {formatBirr(o.totalAmount)}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((line, idx) => (
                    <li
                      key={`${o.id}-${idx}`}
                      className={
                        line.quantity > 1
                          ? 'font-bold text-red-600'
                          : 'text-slate-800'
                      }
                    >
                      {line.quantity}× {line.productName}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onAccept(o)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <ChefHat className="h-3.5 w-3.5" />
                    Accept &amp; prepare
                  </button>
                  {canPrintKitchenTicket(o) ? (
                    <button
                      type="button"
                      onClick={() => onPrintKitchen(o)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print to kitchen
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onCancel(o)}
                    className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
            {preparingOrders.map((o) => (
              <div
                key={o.id}
                className="relative rounded-lg border-2 border-dashed border-slate-900 bg-amber-50/40 p-5 font-mono shadow-inner"
              >
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <div className="text-xs uppercase tracking-widest text-slate-600">
                    {o.shopName}
                  </div>
                  <div className="mt-1 text-2xl font-black tabular-nums text-slate-900">
                    #{shortId(o.id)}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    Table:{' '}
                    <span className="font-semibold">
                      {o.tableName?.trim() || '—'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {o.items.map((line, idx) => (
                    <li
                      key={`${o.id}-k-${idx}`}
                      className="flex justify-between gap-3 border-b border-slate-200/80 pb-2 last:border-0"
                    >
                      <span className="min-w-0 flex-1 text-slate-900">
                        {line.productName}
                      </span>
                      <span
                        className={
                          line.quantity > 1
                            ? 'font-bold text-red-600'
                            : 'font-medium text-slate-800'
                        }
                      >
                        ×{line.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-slate-900 pt-4">
                  {canPrintKitchenTicket(o) ? (
                    <button
                      type="button"
                      onClick={() => onPrintKitchen(o)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print to kitchen
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => onComplete(o)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function DispatchViewBody({
  orders,
  loading,
  selectedId,
  setSelectedId,
  selected,
  mutating,
  runStatus,
  onPrintKitchen,
}: {
  orders: MerchantDispatchOrderRow[]
  loading: boolean
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  selected: MerchantDispatchOrderRow | null
  mutating: boolean
  runStatus: (
    o: MerchantDispatchOrderRow,
    s: 'PREPARING' | 'COMPLETED' | 'CANCELLED',
  ) => void
  onPrintKitchen: (o: MerchantDispatchOrderRow) => void
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Orders</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No orders in the queue.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={[
                      'flex w-full flex-col gap-1 px-4 py-3 text-left transition',
                      selectedId === o.id
                        ? 'border-l-4 border-orange-500 bg-orange-50/80'
                        : 'border-l-4 border-transparent hover:bg-slate-50',
                      o.status === 'PENDING'
                        ? 'animate-pulse shadow-[inset_0_0_12px_rgba(239,68,68,0.12)]'
                        : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        #{shortId(o.id)}
                      </span>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                          o.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : o.status === 'PREPARING'
                              ? 'bg-blue-100 text-blue-800'
                              : o.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatRelativeEn(o.createdAt)}</span>
                      <span className="font-semibold text-slate-800">
                        {formatBirr(o.totalAmount)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Order detail</h2>
        </div>
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
            Select an order from the list.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="border-b border-slate-50 px-4 py-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-500">Order No.</span>
                <span className="font-mono font-medium text-slate-900">
                  {selected.orderNo}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Shop </span>
                  <span className="text-slate-800">{selected.shopName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Table </span>
                  <span className="text-slate-800">
                    {selected.tableName?.trim() || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Placed </span>
                  <span className="text-slate-800">
                    {formatRelativeEn(selected.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total </span>
                  <span className="font-semibold text-slate-900">
                    {formatBirr(selected.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Package className="h-4 w-4" />
                Line items
              </h3>
              <ul className="space-y-3">
                {selected.items.map((line, idx) => (
                  <li
                    key={`${selected.id}-${idx}-${line.productName}`}
                    className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">
                        {line.productName}
                      </div>
                      <div
                        className={
                          line.quantity > 1
                            ? 'text-sm font-bold text-red-600'
                            : 'text-xs text-slate-500'
                        }
                      >
                        × {line.quantity}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto border-t border-slate-100 px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {selected.status === 'PENDING' ? (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => void runStatus(selected, 'PREPARING')}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                  >
                    <ChefHat className="h-4 w-4" />
                    Accept &amp; prepare
                  </button>
                ) : null}
                {selected && canPrintKitchenTicket(selected) ? (
                  <button
                    type="button"
                    onClick={() => onPrintKitchen(selected)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    Print to kitchen
                  </button>
                ) : null}
                {selected.status === 'PREPARING' ? (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => void runStatus(selected, 'COMPLETED')}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as completed
                  </button>
                ) : null}
                {selected.status !== 'COMPLETED' &&
                selected.status !== 'CANCELLED' ? (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => void runStatus(selected, 'CANCELLED')}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel order
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
