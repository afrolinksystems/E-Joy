import { UserPlus, Users } from 'lucide-react'

type StaffHeaderProps = {
  shopId: string | null
  onAdd: () => void
}

export function StaffHeader({ shopId, onAdd }: StaffHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Shop{' '}
            <span className="font-mono font-semibold text-slate-700">
              {shopId}
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
      >
        <UserPlus className="h-4 w-4" />
        Add new staff
      </button>
    </div>
  )
}

