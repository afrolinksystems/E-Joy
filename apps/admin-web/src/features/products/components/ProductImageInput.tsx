import type { ProductFormState } from '../products.types'

type ProductImageInputProps = {
  form: ProductFormState
  uploadError: string | null
  uploading: boolean
  onFileUpload: (file: File | undefined) => void
  onFormChange: React.Dispatch<React.SetStateAction<ProductFormState>>
}

export function ProductImageInput({
  form,
  uploadError,
  uploading,
  onFileUpload,
  onFormChange,
}: ProductImageInputProps) {
  return (
    <div className="block">
      <span className="text-sm font-medium text-slate-700">Item image</span>
      <div className="mt-1 flex flex-wrap items-start gap-3">
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            onFileUpload(file)
            event.target.value = ''
          }}
          className="min-w-0 flex-1 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-800 hover:file:bg-orange-100"
        />
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt="Preview"
            className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
        ) : null}
      </div>
      {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
      {uploadError ? (
        <p className="mt-1 text-xs text-red-600">{uploadError}</p>
      ) : null}
      {form.imageUrl ? (
        <button
          type="button"
          onClick={() => onFormChange((current) => ({ ...current, imageUrl: '' }))}
          className="mt-2 text-xs text-slate-600 underline hover:text-slate-900"
        >
          Remove image
        </button>
      ) : null}
    </div>
  )
}

