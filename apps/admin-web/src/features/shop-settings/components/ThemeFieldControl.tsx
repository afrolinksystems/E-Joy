import type { ThemeFieldKey } from '../shop-settings.types'
import { normalizeColorValue } from '../shop-settings.utils'

type ThemeFieldControlProps = {
  fallback: string
  fieldKey: ThemeFieldKey
  label: string
  value: string
  onChange: (key: ThemeFieldKey, value: string) => void
}

export function ThemeFieldControl({
  fallback,
  fieldKey,
  label,
  value,
  onChange,
}: ThemeFieldControlProps) {
  const currentValue = value.trim()

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={normalizeColorValue(currentValue || fallback)}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          className="h-10 w-14 rounded border border-slate-300 bg-white p-1"
        />
        <input
          value={value}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder={fallback}
          maxLength={7}
          className="w-[92px] rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => onChange(fieldKey, '')}
          className="text-xs text-slate-500 underline hover:text-slate-800"
        >
          Use preset
        </button>
      </div>
    </div>
  )
}

