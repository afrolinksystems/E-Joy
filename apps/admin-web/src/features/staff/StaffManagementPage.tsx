import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
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
        <Alert variant="destructive">
          <AlertTitle>Staff could not load</AlertTitle>
          <AlertDescription>{state.error.message}</AlertDescription>
        </Alert>
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
