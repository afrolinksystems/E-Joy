import {
  useApolloClient,
  useMutation,
  useQuery,
  useSubscription,
} from '@apollo/client/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Printer,
  Users,
  X,
} from 'lucide-react'
import {
  MERCHANT_DISPATCH_ORDERS,
  type MerchantDispatchData,
  type MerchantDispatchOrderRow,
} from '../graphql/merchantOrders'
import {
  CREATE_TABLE,
  DELETE_TABLE,
  GET_TABLES,
  TABLE_STATUS_CHANGED,
  UPDATE_TABLE,
  UPDATE_TABLE_POSITIONS,
  type GetTablesData,
  type TableRow,
  type TableStatusChangedData,
  type UpdateTableData,
} from '../graphql/tables'
import { TableQRCodeModal } from '../components/TableQRCodeModal'
import { KitchenReceipt } from '../components/KitchenReceipt'
import { canPrintKitchenTicket, useKitchenPrint } from '../lib/kitchenPrint'
import { useAdminSession } from '../lib/adminSession'

const POLL_MS = 3000
/** Snap to 2% grid on the normalized 0–1 floor. */
const SNAP_STEP = 0.02

function snap01(v: number): number {
  const s = Math.round(v / SNAP_STEP) * SNAP_STEP
  return Math.max(0, Math.min(1, s))
}

function formatBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function gqlErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'graphQLErrors' in err) {
    const g = (err as { graphQLErrors?: { message?: string }[] }).graphQLErrors
    if (g?.[0]?.message) return g[0].message
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}

function cardClassForStatus(status: TableRow['status']): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-500 text-white ring-2 ring-emerald-700/40 shadow-lg'
    case 'OCCUPIED':
      return 'bg-orange-500 text-white ring-2 ring-orange-800/50 shadow-lg'
    case 'DIRTY':
      return 'bg-slate-500 text-white ring-2 ring-slate-700/50 shadow-lg'
    default:
      return 'bg-slate-400 text-white'
  }
}

type Pos = { posX: number; posY: number }

export function TableView() {
  const { shopId } = useAdminSession()
  const [selected, setSelected] = useState<TableRow | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [localPositions, setLocalPositions] = useState<Record<string, Pos>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [menuOpenTableId, setMenuOpenTableId] = useState<string | null>(null)
  const [editTable, setEditTable] = useState<TableRow | null>(null)
  const [editFormNumber, setEditFormNumber] = useState('')
  const [editFormCapacity, setEditFormCapacity] = useState('')
  const [tableActionError, setTableActionError] = useState<string | null>(null)
  const [qrTable, setQrTable] = useState<TableRow | null>(null)
  const { kitchenPrintRef, orderToPrint, requestKitchenPrint } =
    useKitchenPrint()
  const apolloClient = useApolloClient()

  const floorRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    id: string
    startClientX: number
    startClientY: number
    originX: number
    originY: number
  } | null>(null)

  const {
    data: tablesData,
    loading: tablesLoading,
    error: tablesError,
    refetch: refetchTables,
  } = useQuery<GetTablesData>(GET_TABLES, {
    variables: { shopId },
    pollInterval: isEditMode ? undefined : POLL_MS,
    fetchPolicy: 'network-only',
  })

  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery<MerchantDispatchData>(MERCHANT_DISPATCH_ORDERS, {
    variables: { shopId },
    pollInterval: isEditMode ? undefined : POLL_MS,
    fetchPolicy: 'network-only',
  })

  useSubscription<TableStatusChangedData>(TABLE_STATUS_CHANGED, {
    variables: { shopId },
    skip: isEditMode,
    onData: ({ data: subData }) => {
      const t = subData.data?.tableStatusChanged
      if (!t || t.shopId !== shopId) return
      apolloClient.cache.updateQuery<GetTablesData>(
        { query: GET_TABLES, variables: { shopId } },
        (prev) => {
          if (!prev?.getTables) return prev
          return {
            getTables: prev.getTables.map((row) =>
              row.id === t.id ? { ...row, ...t } : row,
            ),
          }
        },
      )
      setSelected((prev) =>
        prev?.id === t.id ? { ...prev, ...t } : prev,
      )
    },
  })

  const [savePositions, { loading: savingLayout }] = useMutation(
    UPDATE_TABLE_POSITIONS,
  )
  const [createTableMut, { loading: creatingTable }] = useMutation(CREATE_TABLE)
  const [updateTableMut, { loading: updatingTable }] =
    useMutation<UpdateTableData>(UPDATE_TABLE)
  const [deleteTableMut, { loading: deletingTable }] = useMutation(DELETE_TABLE)

  const tables: TableRow[] = (tablesData?.getTables ?? []) as TableRow[]
  const orders = ordersData?.merchantDispatchOrders ?? []

  useEffect(() => {
    if (!isEditMode) return
    setLocalPositions((prev) => {
      const next = { ...prev }
      for (const t of tables) {
        if (!next[t.id]) {
          next[t.id] = { posX: t.posX, posY: t.posY }
        }
      }
      return next
    })
  }, [tables, isEditMode])

  const displayTables = useMemo((): TableRow[] => {
    return tables.map((t) => {
      const o = localPositions[t.id]
      if (!o) return t
      return { ...t, posX: o.posX, posY: o.posY }
    })
  }, [tables, localPositions])

  const beginEditLayout = useCallback(() => {
    setLocalPositions(
      Object.fromEntries(
        tables.map((t) => [t.id, { posX: t.posX, posY: t.posY }]),
      ),
    )
    setIsEditMode(true)
  }, [tables])

  const cancelEdit = useCallback(() => {
    setIsEditMode(false)
    setLocalPositions({})
    setDraggingId(null)
    dragRef.current = null
    setMenuOpenTableId(null)
    void refetchTables()
  }, [refetchTables])

  useEffect(() => {
    if (!editTable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditTable(null)
        setTableActionError(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editTable])

  useEffect(() => {
    if (!menuOpenTableId) return
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('[data-table-card-menu]')) return
      setMenuOpenTableId(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpenTableId])

  const saveLayout = useCallback(async () => {
    if (!displayTables.length) {
      setIsEditMode(false)
      setLocalPositions({})
      return
    }
    await savePositions({
      variables: {
        shopId,
        input: displayTables.map((t) => ({
          id: t.id,
          posX: t.posX,
          posY: t.posY,
        })),
      },
    })
    setIsEditMode(false)
    setLocalPositions({})
    await refetchTables()
  }, [displayTables, savePositions, refetchTables])

  const addTable = useCallback(async () => {
    await createTableMut({ variables: { shopId } })
    await refetchTables()
    await refetchOrders()
  }, [createTableMut, refetchTables, refetchOrders])

  const openEditDetails = useCallback((t: TableRow) => {
    setMenuOpenTableId(null)
    setTableActionError(null)
    setEditTable(t)
    setEditFormNumber(t.tableNumber)
    setEditFormCapacity(String(t.capacity))
  }, [])

  const saveEditDetails = useCallback(async () => {
    if (!editTable) return
    const cap = parseInt(editFormCapacity, 10)
    if (!Number.isFinite(cap) || cap < 1 || cap > 99) {
      setTableActionError('Capacity must be an integer from 1 to 99.')
      return
    }
    const trimmed = editFormNumber.trim()
    if (!trimmed) {
      setTableActionError('Table number is required.')
      return
    }
    setTableActionError(null)
    try {
      const { data } = await updateTableMut({
        variables: {
          id: editTable.id,
          tableNumber: trimmed,
          capacity: cap,
          shopId,
        },
      })
      setTableActionError(null)
      setEditTable(null)
      await refetchTables()
      await refetchOrders()
      const u = data?.updateTable
      if (u && selected?.id === u.id) setSelected(u)
    } catch (err: unknown) {
      setTableActionError(gqlErrorMessage(err))
    }
  }, [
    editTable,
    editFormCapacity,
    editFormNumber,
    updateTableMut,
    refetchTables,
    refetchOrders,
    selected,
  ])

  const confirmDeleteTable = useCallback(
    async (t: TableRow) => {
      if (!window.confirm('Are you sure you want to remove this table?')) {
        return
      }
      setMenuOpenTableId(null)
      setTableActionError(null)
      try {
        await deleteTableMut({
        variables: { id: t.id, shopId },
        })
        setLocalPositions((prev) => {
          const next = { ...prev }
          delete next[t.id]
          return next
        })
        if (selected?.id === t.id) setSelected(null)
        await refetchTables()
        await refetchOrders()
      } catch (err: unknown) {
        setTableActionError(gqlErrorMessage(err))
      }
    },
    [deleteTableMut, refetchTables, refetchOrders, selected],
  )

  useEffect(() => {
    if (!draggingId || !dragRef.current) return
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      const floor = floorRef.current
      if (!d || !floor) return
      const rect = floor.getBoundingClientRect()
      const dx = (e.clientX - d.startClientX) / rect.width
      const dy = (e.clientY - d.startClientY) / rect.height
      const nx = snap01(d.originX + dx)
      const ny = snap01(d.originY + dy)
      setLocalPositions((prev) => ({
        ...prev,
        [d.id]: { posX: nx, posY: ny },
      }))
    }
    const onUp = () => {
      setDraggingId(null)
      dragRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { capture: true })
    window.addEventListener('pointercancel', onUp, { capture: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp, { capture: true })
      window.removeEventListener('pointercancel', onUp, { capture: true })
    }
  }, [draggingId])

  const onTablePointerDown = useCallback(
    (e: React.PointerEvent, tableId: string) => {
      if (!isEditMode || !floorRef.current) return
      if ((e.target as HTMLElement).closest('[data-table-card-menu]')) return
      e.preventDefault()
      e.stopPropagation()
      const t = tables.find((x) => x.id === tableId)
      if (!t) return
      const cur = localPositions[tableId] ?? { posX: t.posX, posY: t.posY }
      dragRef.current = {
        id: tableId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: cur.posX,
        originY: cur.posY,
      }
      setDraggingId(tableId)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isEditMode, tables, localPositions],
  )

  const ordersForSelectedTable = useMemo(() => {
    if (!selected) return [] as MerchantDispatchOrderRow[]
    const key = selected.tableNumber.trim()
    return orders
      .filter((o) => {
        const tn = o.tableName?.trim()
        if (!tn || tn !== key) return false
        if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return false
        return true
      })
      .sort((a, b) => {
        const tb = new Date(b.createdAt ?? 0).getTime()
        const ta = new Date(a.createdAt ?? 0).getTime()
        return tb - ta
      })
  }, [orders, selected])

  const primaryOrder = ordersForSelectedTable[0] ?? null
  const error = tablesError ?? ordersError

  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col gap-4 lg:flex-row">
      <div style={{ display: 'none' }} aria-hidden>
        {orderToPrint ? (
          <KitchenReceipt ref={kitchenPrintRef} order={orderToPrint} />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Floor map
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Shop{' '}
              <span className="font-mono font-semibold text-slate-700">
                {shopId}
              </span>
              {isEditMode ? (
                <span className="text-amber-700">
                  {' '}
                  · Edit layout (polling paused)
                </span>
              ) : (
                <span> · Live sync every {POLL_MS / 1000}s</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveLayout()}
                  disabled={savingLayout}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingLayout ? 'Saving…' : 'Save layout'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={savingLayout}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={beginEditLayout}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100"
              >
                <Pencil className="h-4 w-4" />
                Edit layout
              </button>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            Active order
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-500" />
            Dirty
          </span>
          {isEditMode ? (
            <span className="text-slate-500">
              Drag tables · Snap 2% grid
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error.message}
          </div>
        ) : null}
        {tableActionError && !editTable ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {tableActionError}
            <button
              type="button"
              className="ml-auto text-xs font-semibold underline"
              onClick={() => setTableActionError(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div
          ref={floorRef}
          className={[
            'relative min-h-[560px] w-full overflow-hidden rounded-3xl p-4 shadow-inner',
            isEditMode ? 'bg-gray-100' : 'bg-gray-100',
          ].join(' ')}
          style={
            isEditMode
              ? {
                  backgroundImage: `
                    linear-gradient(to right, rgb(209 213 219 / 0.65) 1px, transparent 1px),
                    linear-gradient(to bottom, rgb(209 213 219 / 0.65) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }
              : undefined
          }
        >
          {(tablesLoading || ordersLoading) && tables.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading floor…
            </div>
          ) : tables.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <p>No tables yet. Add a table with the button below.</p>
            </div>
          ) : (
            displayTables.map((t) => (
              <div
                key={t.id}
                role={isEditMode ? 'presentation' : 'button'}
                tabIndex={isEditMode ? -1 : 0}
                onClick={
                  isEditMode
                    ? undefined
                    : () => {
                        setSelected(t)
                      }
                }
                onPointerDown={(e) => onTablePointerDown(e, t.id)}
                className={[
                  'absolute flex min-w-[100px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl px-3 py-3 text-center',
                  draggingId === t.id
                    ? 'cursor-grabbing scale-[1.02] shadow-xl'
                    : isEditMode
                      ? 'cursor-grab touch-none'
                      : 'cursor-pointer hover:brightness-110',
                  draggingId === t.id
                    ? ''
                    : 'transition-all duration-200 ease-out',
                  cardClassForStatus(t.status),
                  selected?.id === t.id && !isEditMode
                    ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-100'
                    : '',
                ].join(' ')}
                style={{
                  left: `${t.posX * 100}%`,
                  top: `${t.posY * 100}%`,
                }}
              >
                {isEditMode ? (
                  <div
                    className="absolute -right-1 -top-1 z-20"
                    data-table-card-menu
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Table actions"
                      aria-expanded={menuOpenTableId === t.id}
                      aria-haspopup="menu"
                      disabled={savingLayout || deletingTable || updatingTable}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenTableId((id) => (id === t.id ? null : t.id))
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white shadow hover:bg-black/40 disabled:opacity-50"
                      title="Settings"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenTableId === t.id ? (
                      <div
                        className="absolute right-0 top-full z-30 mt-1 min-w-[168px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
                        data-table-card-menu
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDetails(t)
                          }}
                        >
                          Edit Details
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenTableId(null)
                            setQrTable(t)
                          }}
                        >
                          Show QR Code
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            void confirmDeleteTable(t)
                          }}
                        >
                          Delete Table
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <span className="text-[10px] font-semibold uppercase opacity-90">
                  Table
                </span>
                <span className="text-sm font-bold leading-tight">
                  {t.tableNumber}
                </span>
                <span className="mt-1 flex items-center gap-0.5 text-[10px] opacity-90">
                  <Users className="h-3 w-3" />
                  {t.capacity}
                </span>
              </div>
            ))
          )}
          <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            {isEditMode
              ? 'Drag to reposition · Save when done'
              : 'Tap a table for live order details'}
          </div>
        </div>
      </div>

      <aside
        className={[
          'w-full shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all lg:w-[380px]',
          selected ? 'opacity-100' : 'opacity-90',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Table detail
          </h2>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(80vh,720px)] overflow-y-auto p-4">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Select a table on the floor plan to view the active order linked to
              that table number (from dispatch data).
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Table
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {selected.tableNumber}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Status:{' '}
                  <span className="font-semibold text-slate-800">
                    {selected.status}
                  </span>
                  {' · '}
                  Seats {selected.capacity}
                </div>
              </div>

              {!primaryOrder ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No open order matches this table in the current dispatch
                  queue.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {primaryOrder.orderNo}
                    </span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-bold uppercase',
                        primaryOrder.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-900'
                          : primaryOrder.status === 'PREPARING'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-slate-200 text-slate-800',
                      ].join(' ')}
                    >
                      {primaryOrder.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Placed {formatTime(primaryOrder.createdAt ?? '')}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    Total {formatBirr(primaryOrder.totalAmount ?? 0)}
                  </div>

                  <h3 className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Package className="h-3.5 w-3.5" />
                    Items
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {(primaryOrder.items ?? []).map((line, idx) => (
                      <li
                        key={`${primaryOrder.id}-${idx}`}
                        className="flex justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 text-slate-800">
                          {line.productName}
                        </span>
                        <span
                          className={
                            (line.quantity ?? 0) > 1
                              ? 'font-bold text-red-600'
                              : 'font-medium text-slate-700'
                          }
                        >
                          ×{line.quantity ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {canPrintKitchenTicket(primaryOrder) ? (
                    <button
                      type="button"
                      onClick={() => requestKitchenPrint(primaryOrder)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                    >
                      <Printer className="h-4 w-4" />
                      Print to kitchen
                    </button>
                  ) : null}

                  {ordersForSelectedTable.length > 1 ? (
                    <p className="mt-3 text-xs text-amber-800">
                      {ordersForSelectedTable.length - 1} additional open
                      order(s) at this table — showing the most recent.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {editTable ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            setEditTable(null)
            setTableActionError(null)
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-table-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-table-title"
              className="text-lg font-semibold text-slate-900"
            >
              Edit table
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Update the display name and seat capacity for this table.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Table number
                </span>
                <input
                  type="text"
                  value={editFormNumber}
                  onChange={(e) => setEditFormNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Capacity
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={editFormCapacity}
                  onChange={(e) => setEditFormCapacity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </label>
            </div>
            {tableActionError ? (
              <p className="mt-3 text-sm text-red-700">{tableActionError}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditTable(null)
                  setTableActionError(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={updatingTable}
                onClick={() => void saveEditDetails()}
              >
                {updatingTable ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <TableQRCodeModal
        table={qrTable}
        open={qrTable !== null}
        onClose={() => setQrTable(null)}
      />

      <button
        type="button"
        onClick={() => void addTable()}
        disabled={creatingTable || savingLayout || deletingTable}
        title="Add table at center of map"
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
        aria-label="Add table"
      >
        {creatingTable ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Plus className="h-7 w-7" />
        )}
      </button>
    </div>
  )
}
