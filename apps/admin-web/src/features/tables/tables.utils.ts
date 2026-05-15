import type { MerchantDispatchOrderRow } from '../../graphql/merchantOrders'
import type { TableRow } from '../../graphql/tables'

export const TABLE_POLL_MS = 3000
export const SNAP_STEP = 0.02
export const QR_SIZE = 256

export function snap01(value: number): number {
  const snapped = Math.round(value / SNAP_STEP) * SNAP_STEP
  return Math.max(0, Math.min(1, snapped))
}

export function formatBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function gqlErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'graphQLErrors' in err) {
    const graphQLErrors = (
      err as { graphQLErrors?: { message?: string }[] }
    ).graphQLErrors
    if (graphQLErrors?.[0]?.message) return graphQLErrors[0].message
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}

export function cardClassForStatus(status: TableRow['status']): string {
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

export function buildCustomerTableLink(table: TableRow): string {
  const raw = import.meta.env.VITE_CUSTOMER_WEB_URL?.trim() ?? ''
  const base = raw.replace(/\/$/, '')
  if (!base) return ''

  const params = new URLSearchParams({
    shopId: table.shopId,
    table: table.tableNumber,
  })
  return `${base}/?${params.toString()}`
}

export function getOpenOrdersForTable(
  orders: MerchantDispatchOrderRow[],
  table: TableRow | null,
): MerchantDispatchOrderRow[] {
  if (!table) return []
  const key = table.tableNumber.trim()
  return orders
    .filter((order) => {
      const tableName = order.tableName?.trim()
      if (!tableName || tableName !== key) return false
      return order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
    })
    .sort((a, b) => {
      const bTime = new Date(b.createdAt ?? 0).getTime()
      const aTime = new Date(a.createdAt ?? 0).getTime()
      return bTime - aTime
    })
}

