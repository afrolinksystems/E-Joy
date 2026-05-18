import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useCartStore,
  useCartTotalPrice,
  useCartTotalQuantity,
} from '../../../store/useCartStore'
import type { CreatedOrderModel, CustomerTab, MenuItem } from '../customer-ordering.types'
import { useCustomerMenu } from './useCustomerMenu'
import { useCustomerOrders } from './useCustomerOrders'
import { useCustomerSessionContext } from './useCustomerSessionContext'
import { useTelebirrCheckout } from './useTelebirrCheckout'

export function useCustomerOrderingApp() {
  const session = useCustomerSessionContext()
  const [activeTab, setActiveTab] = useState<CustomerTab>('menu')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [shopInfoOpen, setShopInfoOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [lastOrder, setLastOrder] = useState<CreatedOrderModel | null>(null)
  const navigate = useNavigate()

  const cart = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const incrementItem = useCartStore((s) => s.incrementItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const deleteItem = useCartStore((s) => s.deleteItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalPrice = useCartTotalPrice()
  const totalQuantity = useCartTotalQuantity()
  const orders = useCustomerOrders({ hasTableSession: session.hasTableSession })
  const menu = useCustomerMenu({
    hasTableSession: session.hasTableSession,
    search,
    selectedCategory,
    setSelectedCategory,
    shopId: session.shopId,
  })
  const checkout = useTelebirrCheckout({
    cart,
    hasTableSession: session.hasTableSession,
    note: orderNote,
    onCheckoutCreated: async (order) => {
      setLastOrder(order)
      const nextOrderIds = orders.rememberOrderId(order.id)
      setCartOpen(false)
      await orders.refetchOrders({ ids: nextOrderIds })
    },
    shopId: session.shopId,
    tableRef: session.tableRef,
  })

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/'
    if (path.endsWith('/order-success') || path === '/order-success') {
      toast.success('Payment received. Your order was sent to the kitchen.')
      setActiveTab('orders')
      clearCart()
      window.history.replaceState({}, document.title, '/')
    }
  }, [clearCart])

  return {
    activeTab,
    addItem,
    cart,
    cartOpen,
    categories: menu.categories,
    checkoutLoading: checkout.checkoutLoading,
    clearCart,
    clearSession: session.clearSession,
    customerThemePreset: menu.customerThemePreset,
    customerThemeVars: menu.customerThemeVars,
    deleteItem,
    detailItem,
    error: menu.error,
    hasTableSession: session.hasTableSession,
    incrementItem,
    lastOrder,
    loading: menu.loading,
    menuRows: menu.menuRows,
    navigate,
    orderNote,
    orders: orders.orders,
    ordersLoading: orders.ordersLoading,
    payWithTelebirr: checkout.payWithTelebirr,
    refetch: menu.refetch,
    refetchOrders: orders.refetchOrders,
    removeItem,
    search,
    selectedCategory,
    setActiveTab,
    setCartOpen,
    setDetailItem,
    setOrderNote,
    setSearch,
    setSelectedCategory,
    setShopInfoOpen,
    shopId: session.shopId,
    shopInfoOpen,
    shopName: menu.shopName,
    tableRef: session.tableRef,
    totalPrice,
    totalQuantity,
    visibleRows: menu.visibleRows,
  }
}

export type CustomerOrderingAppState = ReturnType<typeof useCustomerOrderingApp>
