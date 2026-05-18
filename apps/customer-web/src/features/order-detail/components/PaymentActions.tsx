import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { formatOrderBirr } from '../order-detail.utils'

type PaymentActionsProps = {
  needsPayment: boolean
  onPay: () => void
  totalAmount: number
}

export function PaymentActions({ needsPayment, onPay, totalAmount }: PaymentActionsProps) {
  if (!needsPayment) {
    return (
      <div className="px-3">
        <Alert>
          <AlertTitle>Payment status</AlertTitle>
          <AlertDescription>This order does not need payment action right now.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <footer className="fixed bottom-0 left-1/2 z-20 grid w-[min(480px,100vw)] -translate-x-1/2 grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] items-center gap-3 border-t bg-card/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-14px_30px_rgba(20,20,20,0.08)] backdrop-blur">
      <div className="min-w-0">
        <span className="block text-xs text-muted-foreground">Total</span>
        <strong className="mt-0.5 block text-[17px] font-black">{formatOrderBirr(totalAmount)}</strong>
      </div>
      <Button type="button" className="min-h-12 rounded-full font-black" onClick={onPay}>
        Pay with Telebirr
      </Button>
    </footer>
  )
}
