import type { ManagedShopDetail } from '../restaurants.types'

type ManagersListProps = {
  managers: ManagedShopDetail['managers']
}

export function ManagersList({ managers }: ManagersListProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">Managers</h3>
      <div className="space-y-2">
        {managers.map((manager) => (
          <div key={manager.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {manager.name}
            <div className="text-xs text-slate-500">{manager.phone} Â· {manager.status}</div>
          </div>
        ))}
        {managers.length === 0 ? <div className="text-sm text-slate-500">No manager accounts.</div> : null}
      </div>
    </div>
  )
}
