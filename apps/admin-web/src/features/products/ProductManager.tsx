import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { ProductFormDialog } from './components/ProductFormDialog'
import { ProductHeader } from './components/ProductHeader'
import { ProductTable } from './components/ProductTable'
import { useProductManager } from './hooks/useProductManager'
import { useProductTableControls } from './hooks/useProductTableControls'

export function ProductManager() {
  const state = useProductManager()
  const formState = state.productForm
  const title = formState.editing ? 'Edit item' : 'Add item'
  const gqlError = state.error?.message
  const table = useProductTableControls(state.rows)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <ProductHeader
        filteredCount={table.view.filteredCount}
        shopId={state.shopId}
        totalCount={table.view.totalCount}
        onCreate={state.openCreate}
      />
      {state.toast ? (
        <Alert variant="destructive">
          <AlertTitle>Product action failed</AlertTitle>
          <AlertDescription>{state.toast.message}</AlertDescription>
        </Alert>
      ) : null}
      {gqlError ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load</AlertTitle>
          <AlertDescription>
            {gqlError}. Ensure order-service is running and your secure admin session needs the{' '}
            <code className="rounded bg-destructive/10 px-1">staff:read</code> scope.
          </AlertDescription>
        </Alert>
      ) : null}
      <ProductTable
        actions={table.actions}
        archiving={state.archiving}
        controls={table.controls}
        loading={state.loading}
        rows={table.view.rows}
        view={table.view}
        onArchive={state.onArchiveClick}
        onEdit={state.openEdit}
      />
      <ProductFormDialog
        form={formState.form}
        open={formState.modalOpen}
        saving={state.saving}
        title={title}
        uploadError={formState.uploadError}
        uploading={formState.uploading}
        onClose={state.closeModal}
        onFileUpload={(file) => void formState.handleFileUpload(file)}
        onFormChange={formState.setForm}
        onSubmit={state.onSubmit}
      />
    </div>
  )
}
