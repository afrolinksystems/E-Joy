import { Loader2 } from 'lucide-react'

type FullScreenLoaderProps = {
  label: string
}

export function FullScreenLoader({ label }: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-100 text-slate-600">
      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      {label}
    </div>
  )
}
