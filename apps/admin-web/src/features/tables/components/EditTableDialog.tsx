import type { TableRow } from '../../../graphql/tables'

type EditTableDialogProps = {
  capacity: string
  error: string | null
  number: string
  table: TableRow | null
  updating: boolean
  onCapacityChange: (value: string) => void
  onClose: () => void
  onNumberChange: (value: string) => void
  onSave: () => void
}

export function EditTableDialog({
  capacity,
  error,
  number,
  table,
  updating,
  onCapacityChange,
  onClose,
  onNumberChange,
  onSave,
}: EditTableDialogProps) {
  if (!table) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-table-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="edit-table-title" className="text-lg font-semibold text-slate-900">
          Edit table
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Update the display name and seat capacity for this table.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Table number
            </span>
            <input
              type="text"
              value={number}
              onChange={(event) => onNumberChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Capacity
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={capacity}
              onChange={(event) => onCapacityChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={updating}
            onClick={onSave}
          >
            {updating ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

