import type React from 'react'
import type { ShopSettingsFormState } from '../shop-settings.types'

type OperatingStatusSectionProps = {
  disabled: boolean
  form: ShopSettingsFormState
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
}

export function OperatingStatusSection({
  disabled,
  form,
  onFormChange,
}: OperatingStatusSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Operating status
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {form.isOpen
              ? 'Open - guests can place orders as usual'
              : 'Closed - switch carefully; guests may be unable to order'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.isOpen}
          aria-label={form.isOpen ? 'Open' : 'Closed'}
          disabled={disabled}
          onClick={() =>
            onFormChange((current) => ({ ...current, isOpen: !current.isOpen }))
          }
          className={[
            'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            form.isOpen ? 'bg-emerald-500' : 'bg-slate-300',
          ].join(' ')}
        >
          <span
            className={[
              'pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition',
              form.isOpen ? 'translate-x-7' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </section>
  )
}

