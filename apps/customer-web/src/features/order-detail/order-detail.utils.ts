import { toast } from 'sonner'
import type { OrderStatusVariant } from './order-detail.types'

export const ORDER_DETAIL_PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=320&q=80'

export function formatOrderBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

export function resolveOrderProductImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return ORDER_DETAIL_PLACEHOLDER_IMG
  const value = url.trim()
  if (/^https?:\/\//i.test(value)) return value
  const origin =
    import.meta.env.VITE_ORDER_SERVICE_ORIGIN?.replace(/\/$/, '') ?? 'http://localhost:9602'
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`
}

export function orderNeedsPayment(status: string): boolean {
  const normalized = status.toUpperCase()
  return normalized === 'PENDING_PAYMENT' || normalized === 'DRAFT' || normalized === 'PENDING'
}

export function statusLabel(status: string): string {
  const normalized = status.toUpperCase()
  if (normalized === 'COMPLETED') return 'Completed'
  if (normalized === 'CANCELLED') return 'Cancelled'
  if (normalized === 'READY') return 'Ready for pickup'
  if (normalized === 'PREPARING') return 'Preparing'
  if (normalized === 'PAID') return 'Paid'
  if (orderNeedsPayment(status)) return 'Waiting for Telebirr payment'
  return 'Order received'
}

export function statusVariant(status: string): OrderStatusVariant {
  const normalized = status.toUpperCase()
  if (normalized === 'CANCELLED') return 'destructive'
  if (normalized === 'COMPLETED' || normalized === 'PAID') return 'default'
  if (orderNeedsPayment(status)) return 'secondary'
  return 'outline'
}

export function copyOrderNumber(text: string): void {
  void navigator.clipboard.writeText(text).then(
    () => toast.success('Order number copied'),
    () => {
      window.prompt('Copy order number:', text)
    },
  )
}
