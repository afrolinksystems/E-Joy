import { Loader2 } from 'lucide-react'

type FullScreenLoaderProps = {
  label: string
}

export function FullScreenLoader({ label }: FullScreenLoaderProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin" />
        {label}
      </div>
    </main>
  )
}
