import { UserPlus, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type StaffHeaderProps = {
  shopId: string | null
  onAdd: () => void
}

export function StaffHeader({ shopId, onAdd }: StaffHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Shop <span className="font-mono font-semibold text-foreground">{shopId}</span>
          </p>
        </div>
      </div>
      <Button type="button" onClick={onAdd} className="h-9">
        <UserPlus data-icon="inline-start" />
        Add new staff
      </Button>
    </div>
  )
}
