import { useMutation, useQuery } from '@apollo/client/react'
import { useEffect, useMemo, useState } from 'react'
import {
  MERCHANT_DISPATCH_ORDERS,
  UPDATE_ORDER_STATUS,
  type MerchantDispatchData,
  type MerchantDispatchOrderRow,
} from '../../../graphql/merchantOrders'
import { useAdminSession } from '../../../lib/adminSession'
import { useKitchenPrint } from '../../printing/hooks/useKitchenPrint'
import type { OrderStatusAction } from '../orders.types'
import { POLL_DISPATCH_MS, POLL_KITCHEN_MS } from '../orders.utils'
import { useNewOrderChime } from './useNewOrderChime'

export function useMerchantOrders() {
  const { shopId } = useAdminSession()
  const [kitchenView, setKitchenView] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const printState = useKitchenPrint()
  const pollMs = kitchenView ? POLL_KITCHEN_MS : POLL_DISPATCH_MS

  const { data, loading, error, refetch } = useQuery<MerchantDispatchData>(
    MERCHANT_DISPATCH_ORDERS,
    {
      variables: { shopId },
      pollInterval: pollMs,
      fetchPolicy: 'network-only',
    },
  )

  const orders = useMemo(
    () => data?.merchantDispatchOrders ?? [],
    [data?.merchantDispatchOrders],
  )
  useNewOrderChime(orders)

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'PENDING'),
    [orders],
  )

  const preparingOrders = useMemo(
    () => orders.filter((order) => order.status === 'PREPARING'),
    [orders],
  )

  const selected = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  )

  useEffect(() => {
    if (!selectedId && orders.length > 0) {
      setSelectedId(orders[0].id)
    }
  }, [orders, selectedId])

  const [mutate, { loading: mutating }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => void refetch(),
  })

  async function runStatus(
    order: MerchantDispatchOrderRow,
    status: OrderStatusAction,
  ) {
    await mutate({
      variables: { id: order.id, status, shopId },
    })
  }

  return {
    error,
    kitchenView,
    loading,
    mutating,
    orders,
    pendingOrders,
    pollMs,
    preparingOrders,
    printState,
    refetch,
    runStatus,
    selected,
    selectedId,
    setKitchenView,
    setSelectedId,
    shopId,
  }
}
