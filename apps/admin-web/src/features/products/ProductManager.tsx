import { ProductFormDialog } from './components/ProductFormDialog'
import { ProductHeader } from './components/ProductHeader'
import { ProductTable } from './components/ProductTable'
import { useProductManager } from './hooks/useProductManager'

export function ProductManager() {
  const state = useProductManager()
  const formState = state.productForm
  const title = formState.editing ? 'Edit item' : 'Add item'
  const gqlError = state.error?.message

  return (
    <div className="space-y-4">
      <ProductHeader shopId={state.shopId} onCreate={state.openCreate} />
      {state.toast ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-sm"
        >
          {state.toast.message}
        </div>
      ) : null}
      {gqlError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {gqlError}. Ensure order-service is running and Your
          secure admin session needs the{' '}
          <code className="rounded bg-red-100 px-1">staff:read</code> scope.
        </div>
      ) : null}
      <ProductTable
        archiving={state.archiving}
        loading={state.loading}
        rows={state.rows}
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

