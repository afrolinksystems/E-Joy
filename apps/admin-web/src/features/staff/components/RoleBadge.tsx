import { Badge } from '../../../components/ui/badge'
import { roleBadge } from '../staff.utils'

type RoleBadgeProps = {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const badge = roleBadge(role)

  return (
    <Badge variant="secondary" className={badge.className}>
      {badge.label}
    </Badge>
  )
}
