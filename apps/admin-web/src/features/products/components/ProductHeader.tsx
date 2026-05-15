import { Plus } from 'lucide-react'

type ProductHeaderProps = {
  shopId: string | null
  onCreate: () => void
}

export function ProductHeader({ shopId, onCreate }: ProductHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Menu items</h2>
        <p className="text-sm text-slate-500">
          Shop{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
            {shopId}
          </code>{' '}
          · Enter price in Birr; it is stored as cents on save
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    </div>
  )
}

