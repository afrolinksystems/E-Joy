import type React from 'react'
import type { ShopSettingsFormState } from '../shop-settings.types'

type BrandingSectionProps = {
  disabled: boolean
  form: ShopSettingsFormState
  uploadError: string | null
  uploading: boolean
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
  onPickLogo: (file: File | undefined) => void
}

export function BrandingSection({
  disabled,
  form,
  uploadError,
  uploading,
  onFormChange,
  onPickLogo,
}: BrandingSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Branding</h3>
      <p className="mt-1 text-xs text-slate-500">
        Upload your shop logo; it is stored as a public URL
      </p>
      <div className="mt-4">
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0]
            onPickLogo(file)
            event.target.value = ''
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-800 hover:file:bg-orange-100 disabled:opacity-50"
        />
        {uploading ? <p className="mt-2 text-xs text-slate-500">Uploading...</p> : null}
        {uploadError ? (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        ) : null}
        {form.logoUrl ? (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={form.logoUrl}
              alt="Logo preview"
              className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onFormChange((current) => ({ ...current, logoUrl: '' }))
              }
              className="text-xs text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
            >
              Remove logo
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

