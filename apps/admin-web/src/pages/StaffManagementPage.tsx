import { useMutation, useQuery } from '@apollo/client/react'
import { useCallback, useMemo, useState } from 'react'
import {
  AlertCircle,
  Edit,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  CREATE_STAFF_ACCOUNT,
  DELETE_STAFF_USER,
  GET_STAFF_LIST,
  UPDATE_STAFF_ROLE,
  type GetStaffListData,
  type StaffRole,
  type StaffUserRow,
} from '../graphql/staff'
import { useAdminSession } from '../lib/adminSession'

type RoleBadgeConfig = { label: string; className: string }

/** Friendly labels + colours; extends for future roles (CASHIER, KITCHEN, …). */
function roleBadge(role: string): RoleBadgeConfig {
  const r = role.toUpperCase()
  switch (r) {
    case 'MANAGER':
      return {
        label: 'Manager',
        className: 'bg-red-100 text-red-900 ring-1 ring-red-200',
      }
    case 'CASHIER':
      return {
        label: 'Cashier',
        className: 'bg-blue-100 text-blue-900 ring-1 ring-blue-200',
      }
    case 'KITCHEN':
      return {
        label: 'Kitchen',
        className: 'bg-orange-100 text-orange-900 ring-1 ring-orange-200',
      }
    case 'WAITER':
      return {
        label: 'Waiter',
        className: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
      }
    default:
      return {
        label: role,
        className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      }
  }
}

function statusBadge(status: string): { label: string; className: string } {
  const s = status.toUpperCase()
  if (s === 'ACTIVE') {
    return { label: 'Active', className: 'bg-emerald-50 text-emerald-800' }
  }
  if (s === 'INACTIVE') {
    return { label: 'Inactive', className: 'bg-slate-100 text-slate-600' }
  }
  if (s === 'SUSPENDED') {
    return { label: 'Suspended', className: 'bg-amber-50 text-amber-900' }
  }
  return { label: status, className: 'bg-slate-50 text-slate-600' }
}

export function StaffManagementPage() {
  const { shopId } = useAdminSession()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<StaffUserRow | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<StaffRole>('WAITER')
  const [editRole, setEditRole] = useState<StaffRole>('WAITER')

  const { data, loading, error, refetch } = useQuery<GetStaffListData>(
    GET_STAFF_LIST,
    {
      variables: { shopId },
      fetchPolicy: 'network-only',
    },
  )

  const [createStaff, { loading: creating }] = useMutation(
    CREATE_STAFF_ACCOUNT,
    {
      onCompleted: () => {
        void refetch()
        setAddOpen(false)
        setFormName('')
        setFormPhone('')
        setFormPassword('')
        setFormRole('WAITER')
      },
    },
  )

  const [updateRole, { loading: updating }] = useMutation(UPDATE_STAFF_ROLE, {
    onCompleted: () => {
      void refetch()
      setEditRow(null)
    },
  })

  const [deleteStaff, { loading: deleteLoading }] = useMutation(
    DELETE_STAFF_USER,
    {
      onCompleted: () => void refetch(),
    },
  )

  const rows = data?.getStaffList ?? []

  const openAdd = useCallback(() => {
    setFormName('')
    setFormPhone('')
    setFormPassword('')
    setFormRole('WAITER')
    setAddOpen(true)
  }, [])

  const openEdit = useCallback((row: StaffUserRow) => {
    setEditRow(row)
    setEditRole(row.role)
  }, [])

  const submitAdd = useCallback(async () => {
    const name = formName.trim()
    const phone = formPhone.trim()
    const password = formPassword
    if (!name || !phone || !password) {
      window.alert('Please fill in name, phone, and initial password.')
      return
    }
    await createStaff({
      variables: {
        input: {
          name,
          phone,
          password,
          role: formRole,
        },
      },
    })
  }, [createStaff, formName, formPhone, formPassword, formRole])

  const submitEditRole = useCallback(async () => {
    if (!editRow) return
    await updateRole({
      variables: {
        input: { userId: editRow.id, newRole: editRole },
      },
    })
  }, [editRow, editRole, updateRole])

  const onDelete = useCallback(
    (row: StaffUserRow) => {
      const ok = window.confirm(
        `Remove staff access for ${row.name} (${row.phone})? They will be marked inactive.`,
      )
      if (!ok) return
      void deleteStaff({ variables: { userId: row.id } })
    },
    [deleteStaff],
  )

  const roleOptions = useMemo(
    () =>
      [
        { value: 'MANAGER' as const, label: 'Manager' },
        { value: 'CASHIER' as const, label: 'Cashier' },
        { value: 'KITCHEN' as const, label: 'Kitchen' },
        { value: 'WAITER' as const, label: 'Waiter' },
      ],
    [],
  )

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
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
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
        >
          <UserPlus className="h-4 w-4" />
          Add new staff
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      ) : null}

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
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No staff yet. Click &quot;Add new staff&quot; to create one.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rb = roleBadge(row.role)
                  const sb = statusBadge(row.status)
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                        {row.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            rb.className,
                          ].join(' ')}
                        >
                          {rb.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            sb.className,
                          ].join(' ')}
                        >
                          {sb.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add staff modal */}
      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-staff-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-600" />
                <h2
                  id="add-staff-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Add new staff
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
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
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
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
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </span>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as StaffRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => void submitAdd()}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit role modal */}
      {editRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setEditRow(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-role-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-slate-700" />
                <h2
                  id="edit-role-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Edit role
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{editRow.name}</span>
              {' · '}
              <span className="font-mono">{editRow.phone}</span>
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </span>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as StaffRole)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => void submitEditRole()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
