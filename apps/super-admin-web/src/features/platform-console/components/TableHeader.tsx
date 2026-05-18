import type { ReactNode } from 'react'
import { CardHeader, CardTitle } from '../../../components/ui/card'

type TableHeaderProps = {
  action?: ReactNode
  title: string
}

export function TableHeader({ action, title }: TableHeaderProps) {
  return (
    <CardHeader className="border-b">
      <CardTitle>{title}</CardTitle>
      {action}
    </CardHeader>
  )
}
