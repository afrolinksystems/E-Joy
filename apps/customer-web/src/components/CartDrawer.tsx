import { useMutation } from '@apollo/client/react'
import { useState } from 'react'
import { CREATE_ORDER_MUTATION } from '../graphql/createOrder'
import {
  submitCreateOrderRequest,
  type CreateOrderData,
  type CreateOrderMutationFn,
  type DeliveryTypeUi,
} from '../lib/submitCreateOrder'
import { useTableSession } from '../hooks/useTableSession'
import { useCartStore, useCartTotalPrice } from '../store/useCartStore'
import { useToastStore } from '../store/useToastStore'

/** Cart checkout does not pick payment method here; payment is on order detail when pending. Fixed online intent so order enters pending payment. */
const CART_CREATE_ORDER_PAYMENT = 'TELEBIRR' as const

export type CartDrawerProps = {
  /** Target shop (QR / session); submitCreateOrder falls back to CHECKOUT_SHOP_ID */
  shopId: string
  deliveryType: DeliveryTypeUi
  tableId: string
  selectedAddressId: string
  couponCode: string
  onOrderSuccess: (
    order: NonNullable<NonNullable<CreateOrderData['createOrder']>['order']>,
  ) => void
}

/**
 * Half-screen cart drawer: line items, qty, bottom confirm runs createOrder (server-priced).
 */
export function CartDrawer({
  shopId,
  deliveryType,
  tableId,
  selectedAddressId,
  couponCode,
  onOrderSuccess,
}: CartDrawerProps) {
  const tableSession = useTableSession()
  const isCartOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const incrementItem = useCartStore((s) => s.incrementItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotalCents = useCartTotalPrice()
  const [createOrder] = useMutation(CREATE_ORDER_MUTATION)
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirmSubmit() {
    if (deliveryType === 'DELIVERY' && !selectedAddressId.trim()) {
      useToastStore.getState().show('Please select a delivery address', 'error')
      return
    }
    if (deliveryType === 'DINE_IN' && !tableId.trim()) {
      useToastStore.getState().show('Please enter a table number', 'error')
      return
    }
    if (!items.length) {
      useToastStore.getState().show('Your cart is empty', 'error')
      return
    }

    setSubmitting(true)
    try {
      const outcome = await submitCreateOrderRequest(createOrder as CreateOrderMutationFn, {
        cart: items,
        deliveryType,
        shopId,
        tableId,
        selectedAddressId,
        paymentMethod: CART_CREATE_ORDER_PAYMENT,
        couponCode,
      })
      if (!outcome.success) {
        useToastStore.getState().show(outcome.message, 'error')
        return
      }
      const o = outcome.order
      if (!o?.id) {
        useToastStore.getState().show('Order failed: no order returned', 'error')
        return
      }
      clearCart()
      closeCart()
      onOrderSuccess(o)
      useToastStore.getState().show('Order placed', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isCartOpen) {
    return null
  }

  const canSubmit =
    items.length > 0 &&
    (deliveryType !== 'DELIVERY' || Boolean(selectedAddressId.trim())) &&
    (deliveryType !== 'DINE_IN' || Boolean(tableId.trim()))

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close cart"
        onClick={() => closeCart()}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex max-h-[min(85vh,560px)] w-full flex-col rounded-t-3xl bg-white p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 id="cart-drawer-title" className="text-lg font-bold text-[#1a2c3e]">
            Cart
          </h2>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            onClick={() => closeCart()}
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Your cart is empty</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[#1a2c3e]">{item.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Unit {(item.price / 100).toFixed(0)} Birr
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-0.5 py-0.5">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-slate-700 hover:bg-slate-100"
                      aria-label="Decrease quantity"
                      onClick={() => removeItem(item.id)}
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-slate-700 hover:bg-slate-100"
                      aria-label="Increase quantity"
                      onClick={() => incrementItem(item.id)}
                    >
                      +
                    </button>
                  </div>
                  <div className="shrink-0 text-sm font-bold tabular-nums text-[#e67e22]">
                    {((item.price * item.quantity) / 100).toFixed(0)} Birr
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          {tableSession ? (
            <p className="mb-2 text-center text-xs font-medium text-emerald-800">
              Dine-in · No delivery fee
            </p>
          ) : null}
          <div className="mb-3 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-[#1a2c3e]">{(subtotalCents / 100).toFixed(0)} Birr</span>
          </div>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            className="h-12 w-full rounded-full bg-[#e67e22] text-sm font-bold text-white shadow-md transition enabled:hover:bg-[#d35400] disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => void handleConfirmSubmit()}
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  )
}
