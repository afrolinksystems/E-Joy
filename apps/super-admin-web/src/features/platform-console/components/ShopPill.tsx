import { Power } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import type { ShopStatus } from '../platform-console.types'

type ShopPillProps = {
  status: ShopStatus
}

export function ShopPill({ status }: ShopPillProps) {
  return (
    <Badge variant={status === 'ONLINE' ? 'default' : 'secondary'}>
      <Power data-icon="inline-start" />
      {status}
    </Badge>
  )
}
