import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../../../components/ui/empty'
import { TableHeader } from './TableHeader'

type DataListProps = {
  actionLabel: string
  onAction: () => void
  rowAction?: (index: number) => void
  rows: string[][]
  title: string
}

export function DataList({ actionLabel, onAction, rowAction, rows, title }: DataListProps) {
  return (
    <Card>
      <TableHeader title={title} action={<Button type="button" onClick={onAction}>{actionLabel}</Button>} />
      <CardContent className="p-0">
        <div className="divide-y">
          {rows.map((row, index) => (
            <div key={`${row[0]}-${index}`} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div>
                <div className="font-semibold">{row[0]}</div>
                <div className="text-xs text-muted-foreground">{row[1]}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{row[2]}</span>
                {rowAction ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => rowAction(index)}>
                    Disable
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyTitle>No records.</EmptyTitle>
                <EmptyDescription>{title} will appear here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
