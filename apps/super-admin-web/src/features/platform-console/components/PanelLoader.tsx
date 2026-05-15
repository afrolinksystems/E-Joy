import { Loader2 } from 'lucide-react'

export function PanelLoader() {
  return (
    <section className="grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
      <Loader2 className="animate-spin" />
    </section>
  )
}
