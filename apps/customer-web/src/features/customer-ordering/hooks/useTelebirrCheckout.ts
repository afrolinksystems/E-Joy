import { useMutation } from '@apollo/client/react'
import { CREATE_ORDER_MUTATION } from '../../../graphql/createOrder'
import { buildMockTelebirrRedirectUrl } from '../../../lib/mockTelebirrRedirectUrl'
import type { CartItem } from '../../../store/useCartStore'
import type { CreatedOrderModel, CreateOrderData } from '../customer-ordering.types'

type UseTelebirrCheckoutParams = {
  cart: CartItem[]
  hasTableSession: boolean
  note: string
  onCheckoutCreated: (order: CreatedOrderModel) => Promise<void>
  shopId: string
  tableRef: string
}

export function useTelebirrCheckout({
  cart,
  hasTableSession,
  note,
  onCheckoutCreated,
  shopId,
  tableRef,
}: UseTelebirrCheckoutParams) {
  const [createOrder, { loading: checkoutLoading }] =
    useMutation<CreateOrderData>(CREATE_ORDER_MUTATION)

  async function payWithTelebirr() {
    if (!cart.length || !hasTableSession) return
    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const result = await createOrder({
      variables: {
        input: {
          shopId,
          tableId: tableRef,
          tableNumber: tableRef,
          idempotencyKey,
          paymentMethod: 'TELEBIRR',
          deliveryType: 'DINE_IN',
          note: note.trim() || undefined,
          items: cart.map((item) => ({
            productId: item.id,
            amount: item.quantity,
            remark: item.remark?.trim() || undefined,
          })),
        },
      },
    })
    const payload = result.data?.createOrder
    if (!payload?.ok || !payload.order?.id) {
      const message =
        payload?.error?.message ?? payload?.error?.code ?? 'Could not create order.'
      throw new Error(message)
    }
    await onCheckoutCreated(payload.order)
    window.location.href = buildMockTelebirrRedirectUrl(
      payload.order.id,
      payload.order.totalAmount,
    )
  }

  return {
    checkoutLoading,
    payWithTelebirr,
  }
}
