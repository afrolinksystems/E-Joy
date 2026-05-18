import { useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { GET_ORDER_QUERY, type OrderDetailData } from '../../../graphql/getOrder'
import { buildMockTelebirrRedirectUrl } from '../../../lib/mockTelebirrRedirectUrl'
import { orderNeedsPayment } from '../order-detail.utils'

export function useOrderDetail(orderId: string) {
  const query = useQuery<OrderDetailData>(GET_ORDER_QUERY, {
    variables: { id: orderId },
    skip: !orderId,
    fetchPolicy: 'network-only',
  })
  const order = query.data?.getOrder ?? null

  function payWithTelebirr() {
    if (!order?.id) return
    try {
      window.location.href = buildMockTelebirrRedirectUrl(order.id, order.totalAmount)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Telebirr payment failed')
    }
  }

  return {
    error: query.error,
    loading: query.loading,
    needsPayment: order ? orderNeedsPayment(order.status) : false,
    order,
    payWithTelebirr,
    refetch: query.refetch,
  }
}
