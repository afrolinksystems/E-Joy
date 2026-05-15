import { Loader2, Plus, X } from 'lucide-react'
import type { StaffRole } from '../../../graphql/staff'
import type { StaffFormState } from '../staff.types'
import { STAFF_ROLE_OPTIONS } from '../staff.utils'

type AddStaffDialogProps = {
  creating: boolean
  form: StaffFormState
  open: boolean
  onClose: () => void
  onFormChange: React.Dispatch<React.SetStateAction<StaffFormState>>
  onSubmit: () => void
}

export function AddStaffDialog({
  creating,
  form,
  open,
  onClose,
  onFormChange,
  onSubmit,
}: AddStaffDialogProps) {
  if (!open) return null

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
        aria-labelledby="add-staff-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-600" />
            <h2 id="add-staff-title" className="text-lg font-semibold text-slate-900">
              Add new staff
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
        <p className="mt-1 text-sm text-slate-500">
          Initial password can be shared with the staff member; they should
          change it after first login when supported.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, phone: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Initial password
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </span>
            <select
              value={form.role}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  role: event.target.value as StaffRole,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
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
            disabled={creating}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

