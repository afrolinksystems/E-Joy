import { ArrowLeft } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type DetailTopbarProps = {
  onBack: () => void
  title: string
}

export function DetailTopbar({ onBack, title }: DetailTopbarProps) {
  return (
    <header className="sticky top-0 z-10 grid grid-cols-[44px_1fr_44px] items-center gap-2 bg-background/95 px-3 py-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
      <Button type="button" variant="ghost" size="icon-lg" className="rounded-full" onClick={onBack} aria-label="Back">
        <ArrowLeft />
      </Button>
      <h1 className="text-center text-[18px] font-black">{title}</h1>
      <span />
    </header>
  )
}
