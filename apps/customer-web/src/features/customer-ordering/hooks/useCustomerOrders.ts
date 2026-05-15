import { useQuery } from '@apollo/client/react'
import { useState } from 'react'
import { GET_ORDERS_QUERY, type GetOrdersData } from '../../../graphql/getOrders'
import { persistCustomerOrderIds, readCustomerOrderIds } from '../customer-ordering.utils'

type UseCustomerOrdersParams = {
  hasTableSession: boolean
}

export function useCustomerOrders({ hasTableSession }: UseCustomerOrdersParams) {
  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>(() =>
    readCustomerOrderIds(),
  )

  const query = useQuery<GetOrdersData>(GET_ORDERS_QUERY, {
    skip: !hasTableSession,
    variables: { ids: customerOrderIds },
    fetchPolicy: 'cache-and-network',
  })

  function rememberOrderId(orderId: string) {
    const nextOrderIds = [
      orderId,
      ...customerOrderIds.filter((id) => id !== orderId),
    ]
    setCustomerOrderIds(() => {
      persistCustomerOrderIds(nextOrderIds)
      return nextOrderIds
    })
    return nextOrderIds
  }

  return {
    orders: query.data?.getOrders ?? [],
    ordersLoading: query.loading,
    refetchOrders: query.refetch,
    rememberOrderId,
  }
}
