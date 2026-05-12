import { useReactToPrint } from 'react-to-print'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { MerchantDispatchOrderRow } from '../graphql/merchantOrders'

/** GraphQL `OrderState` values relevant to paid kitchen workflow. */
const KITCHEN_PRINT_ORDER_STATES: ReadonlySet<string> = new Set([
  'PAID',
  'PREPARING',
  'READY',
])

/**
 * Kitchen ticket: only after payment succeeded (canonical `orderState`),
 * and while the order is still on the merchant dispatch board.
 */
export function canPrintKitchenTicket(o: MerchantDispatchOrderRow): boolean {
  if (o.status !== 'PENDING' && o.status !== 'PREPARING') return false
  return KITCHEN_PRINT_ORDER_STATES.has(o.orderState)
}

function waitForReceiptRef(
  ref: RefObject<HTMLDivElement | null>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 80
    const tick = (): void => {
      if (ref.current) {
        resolve()
        return
      }
      attempts += 1
      if (attempts >= maxAttempts) {
        reject(new Error('Kitchen receipt not mounted; cannot print.'))
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

/**
 * Lifecycle-aware print: no contentRef-only race — pass a getter at print time and
 * resolve layout in onBeforePrint so the cloned node is never null.
 */
export function useKitchenPrint() {
  const [orderToPrint, setOrderToPrint] =
    useState<MerchantDispatchOrderRow | null>(null)
  const kitchenPrintRef = useRef<HTMLDivElement>(null)
  const orderForTitleRef = useRef<MerchantDispatchOrderRow | null>(null)
  orderForTitleRef.current = orderToPrint

  const handlePrint = useReactToPrint({
    documentTitle: () =>
      `Ticket_${orderForTitleRef.current?.id ?? 'kitchen'}`,
    pageStyle: `
      @page { size: 80mm auto; margin: 4mm; }
      body { margin: 0; }
    `,
    onBeforePrint: () => waitForReceiptRef(kitchenPrintRef),
    onAfterPrint: () => setOrderToPrint(null),
    onPrintError: (_loc, err) => {
      console.error('[kitchen print]', err)
    },
  })

  const handlePrintRef = useRef(handlePrint)
  handlePrintRef.current = handlePrint

  useEffect(() => {
    if (!orderToPrint) return
    const run = (): void => {
      void handlePrintRef.current(() => kitchenPrintRef.current)
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run)
    })
    return () => window.cancelAnimationFrame(id)
  }, [orderToPrint])

  function requestKitchenPrint(order: MerchantDispatchOrderRow): void {
    setOrderToPrint(order)
  }

  return { kitchenPrintRef, orderToPrint, requestKitchenPrint }
}
