import { Loader2 } from 'lucide-react'
import type { RestaurantApplicationForm } from '../application.types'

type ApplicationFormProps = {
  form: RestaurantApplicationForm
  formError: string
  loading: boolean
  onSubmit: (event: React.FormEvent) => void
  setField: (field: keyof RestaurantApplicationForm, value: string) => void
}

export function ApplicationForm({ form, formError, loading, onSubmit, setField }: ApplicationFormProps) {
  return (
    <form onSubmit={(event) => void onSubmit(event)} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Restaurant name</span>
          <input value={form.shopName} onChange={(event) => setField('shopName', event.target.value)} autoComplete="organization" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Contact person</span>
          <input value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Phone</span>
          <input value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Business license or registration number</span>
          <input value={form.businessLicense} onChange={(event) => setField('businessLicense', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
        </label>
      </div>
      {formError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div> : null}
      <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit application
      </button>
    </form>
  )
}
