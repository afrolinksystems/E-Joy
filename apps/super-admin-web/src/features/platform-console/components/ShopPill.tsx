import { Power } from 'lucide-react'
import type { ShopStatus } from '../platform-console.types'

type ShopPillProps = {
  status: ShopStatus
}

export function ShopPill({ status }: ShopPillProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${status === 'ONLINE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
      <Power size={13} />
      {status}
    </span>
  )
}
