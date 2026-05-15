import type { ReactNode } from 'react'

type TableHeaderProps = {
  action?: ReactNode
  title: string
}

export function TableHeader({ action, title }: TableHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
  )
}
