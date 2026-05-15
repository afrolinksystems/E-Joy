import { Edit, Loader2, Trash2 } from 'lucide-react'
import type { StaffUserRow } from '../../../graphql/staff'
import { RoleBadge } from './RoleBadge'
import { StaffStatusBadge } from './StaffStatusBadge'

type StaffTableProps = {
  deleteLoading: boolean
  loading: boolean
  rows: StaffUserRow[]
  onDelete: (row: StaffUserRow) => void
  onEdit: (row: StaffUserRow) => void
}

export function StaffTable({
  deleteLoading,
  loading,
  rows,
  onDelete,
  onEdit,
}: StaffTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Phone
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  No staff yet. Click &quot;Add new staff&quot; to create one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={row.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StaffStatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="mr-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Edit role"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={() => onDelete(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title="Remove staff"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

