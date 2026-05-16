import { Badge } from '../../../components/ui/badge'
import { statusBadge } from '../staff.utils'

type StaffStatusBadgeProps = {
  status: string
}

export function StaffStatusBadge({ status }: StaffStatusBadgeProps) {
  const badge = statusBadge(status)

  return (
    <Badge variant="secondary" className={badge.className}>
      {badge.label}
    </Badge>
  )
}
