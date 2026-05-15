import { LayoutList, MonitorPlay } from 'lucide-react'

type OrderModeToggleProps = {
  value: boolean
  onChange: (value: boolean) => void
}

export function OrderModeToggle({ value, onChange }: OrderModeToggleProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
          !value
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900',
        ].join(' ')}
      >
        <LayoutList className="h-4 w-4" />
        Dispatch
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
          value
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900',
        ].join(' ')}
      >
        <MonitorPlay className="h-4 w-4" />
        Kitchen view
      </button>
    </div>
  )
}

