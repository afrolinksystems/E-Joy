import { useEffect, useRef } from 'react'
import type { MerchantDispatchOrderRow } from '../../../graphql/merchantOrders'
import { ORDER_CHIME_URL } from '../orders.utils'

export function useNewOrderChime(orders: MerchantDispatchOrderRow[]) {
  const prevPendingIdsRef = useRef<Set<string>>(new Set())
  const audioHydratedRef = useRef(false)

  useEffect(() => {
    const pendingIds = new Set(
      orders.filter((order) => order.status === 'PENDING').map((order) => order.id),
    )

    if (!audioHydratedRef.current) {
      audioHydratedRef.current = true
      prevPendingIdsRef.current = pendingIds
      return
    }

    const prev = prevPendingIdsRef.current
    for (const id of pendingIds) {
      if (!prev.has(id)) {
        try {
          const audio = new Audio(ORDER_CHIME_URL)
          void audio.play()
        } catch {
          return
        }
        break
      }
    }
    prevPendingIdsRef.current = pendingIds
  }, [orders])
}

