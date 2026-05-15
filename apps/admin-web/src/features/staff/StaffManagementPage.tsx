import { AlertCircle } from 'lucide-react'
import { AddStaffDialog } from './components/AddStaffDialog'
import { EditStaffRoleDialog } from './components/EditStaffRoleDialog'
import { StaffHeader } from './components/StaffHeader'
import { StaffTable } from './components/StaffTable'
import { useStaffManagement } from './hooks/useStaffManagement'

export function StaffManagementPage() {
  const state = useStaffManagement()

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <StaffHeader shopId={state.shopId} onAdd={state.openAdd} />
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error.message}
        </div>
      ) : null}
      <StaffTable
        deleteLoading={state.deleteLoading}
        loading={state.loading}
        rows={state.rows}
        onDelete={state.onDelete}
        onEdit={state.openEdit}
      />
      <AddStaffDialog
        creating={state.creating}
        form={state.addForm.form}
        open={state.addOpen}
        onClose={() => state.setAddOpen(false)}
        onFormChange={state.addForm.setForm}
        onSubmit={() => void state.submitAdd()}
      />
      <EditStaffRoleDialog
        editRole={state.editRole}
        row={state.editRow}
        updating={state.updating}
        onClose={() => state.setEditRow(null)}
        onRoleChange={state.setEditRole}
        onSubmit={() => void state.submitEditRole()}
      />
    </div>
  )
}

