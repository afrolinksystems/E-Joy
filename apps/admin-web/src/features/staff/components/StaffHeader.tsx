import { UserPlus, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type StaffHeaderProps = {
  filteredCount: number
  shopId: string | null
  totalCount: number
  onAdd: () => void
}

export function StaffHeader({
  filteredCount,
  shopId,
  totalCount,
  onAdd,
}: StaffHeaderProps) {
  return (
    <div className="shrink-0 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Staff management</h1>
            <p className="text-sm text-muted-foreground">
              Shop <span className="font-mono font-semibold text-foreground">{shopId}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {filteredCount} / {totalCount} shown
          </p>
          <Button type="button" onClick={onAdd} className="h-9">
            <UserPlus data-icon="inline-start" />
            Add new staff
          </Button>
        </div>
      </div>
    </div>
  )
}
