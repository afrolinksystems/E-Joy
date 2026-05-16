import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type ProductHeaderProps = {
  shopId: string | null
  onCreate: () => void
}

export function ProductHeader({ shopId, onCreate }: ProductHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Menu items</h2>
        <p className="text-sm text-muted-foreground">
          Shop <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{shopId}</code> - Enter price in Birr; it is stored as cents on save
        </p>
      </div>
      <Button type="button" onClick={onCreate} className="h-9">
        <Plus data-icon="inline-start" />
        Add item
      </Button>
    </div>
  )
}
