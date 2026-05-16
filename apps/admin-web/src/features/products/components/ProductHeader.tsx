import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type ProductHeaderProps = {
  filteredCount: number
  shopId: string | null
  totalCount: number
  onCreate: () => void
}

export function ProductHeader({
  filteredCount,
  shopId,
  totalCount,
  onCreate,
}: ProductHeaderProps) {
  return (
    <div className="shrink-0 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Menu items</h2>
          <p className="text-sm text-muted-foreground">
            Shop <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{shopId}</code> - Enter price in Birr; it is stored as cents on save
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {filteredCount} / {totalCount} shown
          </p>
          <Button type="button" onClick={onCreate} className="h-9">
            <Plus data-icon="inline-start" />
            Add item
          </Button>
        </div>
      </div>
    </div>
  )
}
