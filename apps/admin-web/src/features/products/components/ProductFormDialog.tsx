import { Loader2 } from 'lucide-react'
import type React from 'react'
import type { ProductFormState } from '../products.types'
import { ProductImageInput } from './ProductImageInput'

type ProductFormDialogProps = {
  form: ProductFormState
  open: boolean
  saving: boolean
  title: string
  uploadError: string | null
  uploading: boolean
  onClose: () => void
  onFileUpload: (file: File | undefined) => void
  onFormChange: React.Dispatch<React.SetStateAction<ProductFormState>>
  onSubmit: (event: React.FormEvent) => void
}

export function ProductFormDialog({
  form,
  open,
  saving,
  title,
  uploadError,
  uploading,
  onClose,
  onFileUpload,
  onFormChange,
  onSubmit,
}: ProductFormDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <input
              required
              value={form.category}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Price (Birr)
            </span>
            <input
              required
              inputMode="decimal"
              value={form.priceBirr}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  priceBirr: event.target.value,
                }))
              }
              placeholder="e.g. 380.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
            />
          </label>
          <ProductImageInput
            form={form}
            uploadError={uploadError}
            uploading={uploading}
            onFileUpload={onFileUpload}
            onFormChange={onFormChange}
          />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-slate-700">Active (on menu)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

