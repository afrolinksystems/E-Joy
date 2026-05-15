import { Pencil } from 'lucide-react'
import { TABLE_POLL_MS } from '../tables.utils'

type FloorToolbarProps = {
  isEditMode: boolean
  savingLayout: boolean
  shopId: string | null
  onBeginEdit: () => void
  onCancelEdit: () => void
  onSaveLayout: () => void
}

export function FloorToolbar({
  isEditMode,
  savingLayout,
  shopId,
  onBeginEdit,
  onCancelEdit,
  onSaveLayout,
}: FloorToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Floor map
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shop{' '}
          <span className="font-mono font-semibold text-slate-700">{shopId}</span>
          {isEditMode ? (
            <span className="text-amber-700"> · Edit layout (polling paused)</span>
          ) : (
            <span> · Live sync every {TABLE_POLL_MS / 1000}s</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditMode ? (
          <>
            <button
              type="button"
              onClick={onSaveLayout}
              disabled={savingLayout}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingLayout ? 'Saving…' : 'Save layout'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={savingLayout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onBeginEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100"
          >
            <Pencil className="h-4 w-4" />
            Edit layout
          </button>
        )}
      </div>
    </div>
  )
}

