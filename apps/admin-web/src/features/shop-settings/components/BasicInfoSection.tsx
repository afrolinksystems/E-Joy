import type React from 'react'
import type { ShopSettingsFormState } from '../shop-settings.types'

type BasicInfoSectionProps = {
  form: ShopSettingsFormState
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
}

export function BasicInfoSection({ form, onFormChange }: BasicInfoSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
      <p className="mt-1 text-xs text-slate-500">
        Public-facing name and contact details
      </p>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Shop name *</span>
          <input
            required
            value={form.name}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, name: event.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            placeholder="Briefly describe your concept, hours, or specialties"
            className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Contact phone</span>
          <input
            inputMode="tel"
            value={form.contactPhone}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                contactPhone: event.target.value,
              }))
            }
            placeholder="+251 ..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50"
          />
        </label>
      </div>
    </section>
  )
}

