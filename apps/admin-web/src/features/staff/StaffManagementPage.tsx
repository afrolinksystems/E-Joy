import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AddStaffDialog } from './components/AddStaffDialog'
import { EditStaffRoleDialog } from './components/EditStaffRoleDialog'
import { StaffHeader } from './components/StaffHeader'
import { StaffTable } from './components/StaffTable'
import { useStaffManagement } from './hooks/useStaffManagement'
import { useStaffTableControls } from './hooks/useStaffTableControls'

export function StaffManagementPage() {
  const state = useStaffManagement()
  const table = useStaffTableControls(state.rows)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <StaffHeader
        filteredCount={table.view.filteredCount}
        shopId={state.shopId}
        totalCount={table.view.totalCount}
        onAdd={state.openAdd}
      />
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Staff could not load</AlertTitle>
          <AlertDescription>{state.error.message}</AlertDescription>
        </Alert>
      ) : null}
      <StaffTable
        actions={table.actions}
        controls={table.controls}
        deleteLoading={state.deleteLoading}
        loading={state.loading}
        rows={table.view.rows}
        view={table.view}
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
