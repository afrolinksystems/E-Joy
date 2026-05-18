import { Spinner } from '../../../components/ui/spinner'

type LoadingStateProps = {
  label: string
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="grid min-h-[260px] place-items-center text-center font-bold text-muted-foreground">
      <div className="flex items-center gap-2">
        <Spinner />
        {label}
      </div>
    </div>
  )
}
