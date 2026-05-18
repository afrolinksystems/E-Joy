import { Spinner } from '../../../components/ui/spinner'

type FullScreenLoaderProps = {
  label: string
}

export function FullScreenLoader({ label }: FullScreenLoaderProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">
      <div className="flex items-center gap-3">
        <Spinner />
        {label}
      </div>
    </main>
  )
}
