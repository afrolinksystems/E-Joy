import { KitchenReceipt } from '../../printing/components/KitchenReceipt'
import type { KitchenPrintState } from '../orders.types'

type HiddenKitchenReceiptProps = {
  printState: KitchenPrintState
}

export function HiddenKitchenReceipt({ printState }: HiddenKitchenReceiptProps) {
  const { kitchenPrintRef, orderToPrint } = printState

  return (
    <div style={{ display: 'none' }} aria-hidden>
      {orderToPrint ? (
        <KitchenReceipt ref={kitchenPrintRef} order={orderToPrint} />
      ) : null}
    </div>
  )
}

