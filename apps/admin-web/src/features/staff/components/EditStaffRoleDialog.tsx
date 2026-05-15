import { Edit, Loader2, X } from 'lucide-react'
import type { StaffRole, StaffUserRow } from '../../../graphql/staff'
import { STAFF_ROLE_OPTIONS } from '../staff.utils'

type EditStaffRoleDialogProps = {
  editRole: StaffRole
  row: StaffUserRow | null
  updating: boolean
  onClose: () => void
  onRoleChange: (role: StaffRole) => void
  onSubmit: () => void
}

export function EditStaffRoleDialog({
  editRole,
  row,
  updating,
  onClose,
  onRoleChange,
  onSubmit,
}: EditStaffRoleDialogProps) {
  if (!row) return null

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
        aria-labelledby="edit-role-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-slate-700" />
            <h2 id="edit-role-title" className="text-lg font-semibold text-slate-900">
              Edit role
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{row.name}</span>
          {' · '}
          <span className="font-mono">{row.phone}</span>
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role
          </span>
          <select
            value={editRole}
            onChange={(event) => onRoleChange(event.target.value as StaffRole)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {STAFF_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

