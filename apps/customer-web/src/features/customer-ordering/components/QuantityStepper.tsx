import { Minus, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type QuantityStepperProps = {
  onDecrement: () => void
  onIncrement: () => void
  quantity: number
}

export function QuantityStepper({
  onDecrement,
  onIncrement,
  quantity,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <Button type="button" variant="outline" size="icon-lg" className="rounded-full" onClick={onDecrement} aria-label="Decrease quantity">
        <Minus />
      </Button>
      <span className="min-w-6 text-center text-[19px] font-black tabular-nums">{quantity}</span>
      <Button type="button" size="icon-lg" className="rounded-full" onClick={onIncrement} aria-label="Increase quantity">
        <Plus />
      </Button>
    </div>
  )
}
