import { roleBadge } from '../staff.utils'

type RoleBadgeProps = {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const badge = roleBadge(role)

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badge.className,
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

