import type { FetchResult } from '@apollo/client'
import { CHECKOUT_SHOP_ID, CHECKOUT_TABLE_ID } from '../constants/checkout'
import type { CartItem } from '../store/useCartStore'

export type DeliveryTypeUi = 'DINE_IN' | 'PICKUP' | 'DELIVERY'

/** Compatible with useMutation(CREATE_ORDER) mutate */
export type CreateOrderMutationFn = (options: {
  variables: { input: Record<string, unknown> }
}) => Promise<FetchResult<unknown>>

export type CreateOrderData = {
  createOrder?: {
    ok: boolean
    error?: { code?: string; message?: string } | null
    order?: {
      id: string
      orderNo?: string
      state?: string
      paymentState?: string
      totalAmount?: number
    } | null
  } | null
}

function apolloFailureMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/**
 * Calls createOrder: new idempotencyKey per submit (crypto.randomUUID);
 * shopId from params or CHECKOUT_SHOP_ID.
 * Business failures return success: false; network errors in catch.
 */
export async function submitCreateOrderRequest(
  createOrder: CreateOrderMutationFn,
  params: {
    cart: CartItem[]
    deliveryType: DeliveryTypeUi
    /** Target shop (QR / session); falls back to CHECKOUT_SHOP_ID */
    shopId?: string
    tableId: string
    selectedAddressId: string
    paymentMethod: 'TELEBIRR' | 'CASH'
    couponCode: string
  },
): Promise<
  | { success: true; order: NonNullable<CreateOrderData['createOrder']>['order'] }
  | { success: false; message: string }
> {
  const {
    cart,
    deliveryType,
    shopId: shopIdParam,
    tableId,
    selectedAddressId,
    paymentMethod,
    couponCode,
  } = params
  const resolvedShopId = shopIdParam?.trim() || CHECKOUT_SHOP_ID

  if (!cart.length) {
    return { success: false, message: 'Your cart is empty' }
  }
  if (deliveryType === 'DELIVERY' && !selectedAddressId) {
    return { success: false, message: 'Please select a delivery address' }
  }
  if (deliveryType === 'DINE_IN' && !tableId.trim()) {
    return { success: false, message: 'Please enter a table number' }
  }

  const idempotencyKey =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const input = {
    shopId: resolvedShopId,
    tableId:
      deliveryType === 'DINE_IN'
        ? tableId.trim() || CHECKOUT_TABLE_ID
        : undefined,
    idempotencyKey,
    paymentMethod,
    deliveryType,
    addressId: deliveryType === 'DELIVERY' ? selectedAddressId : undefined,
    pickupTime: deliveryType === 'PICKUP' ? 'ASAP' : undefined,
    couponCode: couponCode.trim() || undefined,
    items: cart.map((item) => ({
      productId: item.id,
      amount: item.quantity,
    })),
  }

  try {
    const result = await createOrder({ variables: { input: input as Record<string, unknown> } })
    if (result.errors?.length) {
      const msg = result.errors.map((e) => e.message).join('; ')
      return { success: false, message: msg || 'Order failed' }
    }
    const payload = (result.data as CreateOrderData | undefined)?.createOrder
    if (!payload) {
      return { success: false, message: 'Order failed: no response data' }
    }
    if (!payload.ok) {
      const msg = payload.error?.message?.trim() || payload.error?.code || 'Order failed'
      return { success: false, message: msg }
    }
    const order = payload.order
    if (!order?.id) {
      return { success: false, message: 'Order failed: no order returned' }
    }
    return { success: true, order }
  } catch (e) {
    return { success: false, message: apolloFailureMessage(e) }
  }
}
