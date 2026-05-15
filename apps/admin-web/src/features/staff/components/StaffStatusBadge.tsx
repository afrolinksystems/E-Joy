import { statusBadge } from '../staff.utils'

type StaffStatusBadgeProps = {
  status: string
}

export function StaffStatusBadge({ status }: StaffStatusBadgeProps) {
  const badge = statusBadge(status)

  return (
    <span
      className={[
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        badge.className,
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

