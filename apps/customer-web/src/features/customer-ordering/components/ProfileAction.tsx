import type { ReactNode } from 'react'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'

type ProfileActionProps = {
  danger?: boolean
  icon: ReactNode
  label: string
  onClick?: () => void
}

export function ProfileAction({
  danger,
  icon,
  label,
  onClick,
}: ProfileActionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn('h-16 justify-start gap-3 rounded-none px-4 text-[16px] font-bold', danger && 'text-destructive hover:text-destructive')}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  )
}
