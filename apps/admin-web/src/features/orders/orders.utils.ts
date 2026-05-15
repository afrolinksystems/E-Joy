export const POLL_DISPATCH_MS = 5000
export const POLL_KITCHEN_MS = 3000

export const ORDER_CHIME_URL =
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

export function formatBirr(cents: number): string {
  return `${(cents / 100).toFixed(2)} Birr`
}

export function formatRelativeEn(iso: string): string {
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

export function shortId(id: string): string {
  return id.length <= 6 ? id : id.slice(-6)
}

export function orderStatusClass(status: string): string {
  if (status === 'PENDING') return 'bg-amber-100 text-amber-800'
  if (status === 'PREPARING') return 'bg-blue-100 text-blue-800'
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-800'
  return 'bg-slate-200 text-slate-700'
}

