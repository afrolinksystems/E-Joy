import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { Status } from '../platform-console.types'

type StatusPillProps = {
  status: Status
}

export function StatusPill({ status }: StatusPillProps) {
  const Icon = status === 'APPROVED' ? CheckCircle2 : status === 'REJECTED' ? XCircle : AlertTriangle
  const cls = status === 'APPROVED'
    ? 'bg-green-50 text-green-700'
    : status === 'REJECTED'
      ? 'bg-red-50 text-red-700'
      : 'bg-amber-50 text-amber-700'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${cls}`}>
      <Icon size={13} />
      {status}
    </span>
  )
}
