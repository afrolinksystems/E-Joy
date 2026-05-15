import { Badge } from '../../../components/ui/badge'
import { statusLabel, statusVariant } from '../order-detail.utils'

type OrderStatusBadgeProps = {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge className="w-fit" variant={statusVariant(status)}>
      {statusLabel(status)}
    </Badge>
  )
}
