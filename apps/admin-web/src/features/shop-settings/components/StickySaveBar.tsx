import { Loader2 } from 'lucide-react'

type StickySaveBarProps = {
  disabled: boolean
  saving: boolean
}

export function StickySaveBar({ disabled, saving }: StickySaveBarProps) {
  return (
    <div className="fixed bottom-0 left-56 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl justify-end">
        <button
          type="submit"
          form="shop-settings-form"
          disabled={disabled}
          className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </div>
  )
}

