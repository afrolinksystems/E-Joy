import { Badge } from '../../../components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../../../components/ui/empty'
import type { ManagedShopDetail } from '../restaurants.types'

type ManagersListProps = {
  managers: ManagedShopDetail['managers']
}

export function ManagersList({ managers }: ManagersListProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">Managers</h3>
      <div className="flex flex-col gap-2">
        {managers.map((manager) => (
          <div key={manager.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>{manager.name}</span>
              <Badge variant="secondary">{manager.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{manager.phone}</div>
          </div>
        ))}
        {managers.length === 0 ? (
          <Empty className="border-0 p-3">
            <EmptyHeader>
              <EmptyTitle>No manager accounts.</EmptyTitle>
              <EmptyDescription>Managers created for this restaurant will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>
    </div>
  )
}
