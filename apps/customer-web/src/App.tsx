import { useMutation, useQuery } from '@apollo/client/react'
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Home,
  Info,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  UserCircle,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CREATE_ORDER_MUTATION } from './graphql/createOrder'
import { GET_ORDERS_QUERY, type GetOrdersData } from './graphql/getOrders'
import { SHOP_MENU, type ShopMenuProduct } from './graphql/shopMenu'
import { buildMockTelebirrRedirectUrl, getOrderServiceHttpOrigin } from './lib/mockTelebirrRedirectUrl'
import {
  useCartStore,
  useCartTotalPrice,
  useCartTotalQuantity,
  type CartItem,
} from './store/useCartStore'
import { useTableSession } from './hooks/useTableSession'
import { readTableSessionFromLocalStorage, useTableSessionStore } from './store/useTableSessionStore'

type Tab = 'home' | 'menu' | 'orders' | 'profile'
type MenuItem = ShopMenuProduct
type CreateOrderData = {
  createOrder?: {
    ok: boolean
    error?: { code?: string; message?: string } | null
    order?: {
      id: string
      orderNo: string
      state: string
      paymentState: string
      totalAmount: number
    } | null
  } | null
}
type CreatedOrderModel = NonNullable<
  NonNullable<CreateOrderData['createOrder']>['order']
>

const PLACEHOLDER_FOOD =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=420&q=80'
const SPICE_OPTIONS = ['No spice', 'Mild', 'Medium', 'Extra spicy']
const CUSTOMER_ORDER_IDS_KEY = 'ejoy_customer_order_ids_v1'

function readCustomerOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_ORDER_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

function persistCustomerOrderIds(ids: string[]): void {
  localStorage.setItem(CUSTOMER_ORDER_IDS_KEY, JSON.stringify(ids.slice(0, 50)))
}

function formatBirr(cents: number): string {
  const amount = cents / 100
  return `${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)} ETB`
}

function resolveProductImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return PLACEHOLDER_FOOD
  const value = url.trim()
  if (/^https?:\/\//i.test(value)) return value
  const path = value.startsWith('/') ? value : `/${value}`
  return `${getOrderServiceHttpOrigin()}${path}`
}

function buildCartKey(productId: string, remark?: string): string {
  return `${productId}::${remark?.trim() ?? ''}`
}

function tabLabel(tab: Tab): string {
  if (tab === 'home') return 'Home'
  if (tab === 'menu') return 'Order'
  if (tab === 'orders') return 'Orders'
  return 'Me'
}

export default function App() {
  const initialSession = useTableSession(true)
  const cachedSession = readTableSessionFromLocalStorage()
  const sessionShopId = useTableSessionStore((s) => s.sessionShopId)
  const sessionTableRef = useTableSessionStore((s) => s.sessionTableRef)
  const clearSession = useTableSessionStore((s) => s.clearSession)
  const shopId =
    initialSession?.shopId ?? sessionShopId ?? cachedSession.shopId ?? ''
  const tableRef =
    initialSession?.tableNumber ?? sessionTableRef ?? cachedSession.table ?? ''
  const hasTableSession = Boolean(shopId.trim() && tableRef.trim())

  const [activeTab, setActiveTab] = useState<Tab>('menu')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [shopInfoOpen, setShopInfoOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [lastOrder, setLastOrder] = useState<CreatedOrderModel | null>(null)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>(() =>
    readCustomerOrderIds(),
  )
  const navigate = useNavigate()

  const cart = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const incrementItem = useCartStore((s) => s.incrementItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const deleteItem = useCartStore((s) => s.deleteItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalPrice = useCartTotalPrice()
  const totalQuantity = useCartTotalQuantity()

  const { data, loading, error, refetch } = useQuery<{ shopMenu: MenuItem[] }>(
    SHOP_MENU,
    {
      variables: { shopId },
      skip: !hasTableSession,
      fetchPolicy: 'cache-and-network',
    },
  )

  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery<GetOrdersData>(GET_ORDERS_QUERY, {
    skip: !hasTableSession,
    variables: { ids: customerOrderIds },
    fetchPolicy: 'cache-and-network',
  })

  const [createOrder, { loading: checkoutLoading }] =
    useMutation<CreateOrderData>(CREATE_ORDER_MUTATION)

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/'
    if (path.endsWith('/order-success') || path === '/order-success') {
      setPaymentMessage('Payment received. Your order was sent to the kitchen.')
      setActiveTab('orders')
      clearCart()
      window.history.replaceState({}, document.title, '/')
    }
  }, [clearCart])

  const menuRows = data?.shopMenu ?? []
  const shopName = 'E-Joy Restaurant'
  const categories = useMemo(() => {
    const values = menuRows.map((row) => row.category || 'Menu')
    return ['All', ...Array.from(new Set(values))]
  }, [menuRows])

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return menuRows.filter((row) => {
      const inCategory =
        selectedCategory === 'All' || row.category === selectedCategory
      const inSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query)
      return inCategory && inSearch
    })
  }, [menuRows, search, selectedCategory])

  useEffect(() => {
    if (selectedCategory === 'All') return
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory])

  async function payWithTelebirr() {
    if (!cart.length || !hasTableSession) return
    setPaymentMessage(null)
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
          note: orderNote.trim() || undefined,
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
    setLastOrder(payload.order)
    const nextOrderIds = [payload.order.id, ...customerOrderIds.filter((id) => id !== payload.order!.id)]
    setCustomerOrderIds(() => {
      const next = nextOrderIds
      persistCustomerOrderIds(next)
      return next
    })
    setCartOpen(false)
    await refetchOrders({ ids: nextOrderIds })
    window.location.href = buildMockTelebirrRedirectUrl(payload.order.id)
  }

  if (!hasTableSession) {
    return <MissingQrScreen />
  }

  return (
    <main className="mini-app-shell">
      <div className="mini-app-frame">
        {activeTab === 'home' ? (
          <HomeScreen shopName={shopName} onStart={() => setActiveTab('menu')} />
        ) : null}

        {activeTab === 'menu' ? (
          <MenuScreen
            cart={cart}
            categories={categories}
            error={error?.message}
            loading={loading}
            menuRows={menuRows}
            onAdd={(item) => addItem({ id: item.id, name: item.name, price: item.unitPrice })}
            onOpenCart={() => setCartOpen(true)}
            onOpenDetail={setDetailItem}
            onOpenInfo={() => setShopInfoOpen(true)}
            onRefetch={() => void refetch()}
            search={search}
            selectedCategory={selectedCategory}
            setSearch={setSearch}
            setSelectedCategory={setSelectedCategory}
            shopName={shopName}
            tableRef={tableRef}
            totalPrice={totalPrice}
            totalQuantity={totalQuantity}
            visibleRows={visibleRows}
          />
        ) : null}

        {activeTab === 'orders' ? (
          <OrdersScreen
            loading={ordersLoading}
            orders={ordersData?.getOrders ?? []}
            paymentMessage={paymentMessage}
            onGoOrder={() => setActiveTab('menu')}
            onOpenOrder={(id) => navigate(`/orders/${id}`)}
            onRefresh={() => void refetchOrders()}
          />
        ) : null}

        {activeTab === 'profile' ? (
          <ProfileScreen
            shopId={shopId}
            tableRef={tableRef}
            onClearSession={() => {
              clearCart()
              clearSession()
              window.location.reload()
            }}
            onGoOrders={() => setActiveTab('orders')}
          />
        ) : null}

        <BottomTabs activeTab={activeTab} onSelect={setActiveTab} totalQuantity={totalQuantity} />
      </div>

      {detailItem ? (
        <ItemDetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAdd={(quantity, remark) => {
            addItem({
              id: detailItem.id,
              name: detailItem.name,
              price: detailItem.unitPrice,
              quantity,
              remark,
            })
            setDetailItem(null)
          }}
        />
      ) : null}

      {cartOpen ? (
        <CartSheet
          cart={cart}
          checkoutLoading={checkoutLoading}
          deleteItem={deleteItem}
          incrementItem={incrementItem}
          lastOrder={lastOrder}
          note={orderNote}
          onClear={clearCart}
          onClose={() => setCartOpen(false)}
          onPay={payWithTelebirr}
          removeItem={removeItem}
          setNote={setOrderNote}
          totalPrice={totalPrice}
          totalQuantity={totalQuantity}
        />
      ) : null}

      {shopInfoOpen ? (
        <ShopInfoSheet shopName={shopName} tableRef={tableRef} onClose={() => setShopInfoOpen(false)} />
      ) : null}
    </main>
  )
}

function HomeScreen({ onStart, shopName }: { onStart: () => void; shopName: string }) {
  return (
    <section className="screen relative overflow-hidden bg-black text-white">
      <img
        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=82"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black" />
      <div className="relative z-10 flex min-h-[100svh] flex-col px-7 pb-[calc(104px+env(safe-area-inset-bottom))] pt-[calc(42px+env(safe-area-inset-top))]">
        <div className="ml-auto rounded-full bg-white/92 px-4 py-2 text-[13px] font-bold text-neutral-900 shadow-sm">
          Table ordering
        </div>
        <div className="mt-auto">
          <h1 className="max-w-[12ch] text-[34px] font-black leading-[1.06] tracking-normal">
            {shopName}
          </h1>
          <p className="mt-3 max-w-[260px] text-[15px] font-medium leading-6 text-white/78">
            Browse the menu, pay with Telebirr, and we bring the order to your table.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-8 h-14 w-full rounded-full border border-white/65 bg-[#d29a31] text-[22px] font-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.28)] active:scale-[0.99]"
          >
            Start ordering
          </button>
        </div>
      </div>
    </section>
  )
}

function MissingQrScreen() {
  return (
    <main className="mini-app-shell">
      <div className="qr-gate">
        <div className="qr-card">
          <div className="qr-icon">
            <UtensilsCrossed size={38} />
          </div>
          <h1>Scan your table QR code</h1>
          <p>
            Open this mini app from the QR code on your table so we know where to
            send your food.
          </p>
          <div className="qr-example">
            Local demo URL:
            <code>?shopId=test-shop-001&amp;table=test-table-001</code>
          </div>
        </div>
      </div>
    </main>
  )
}

function MenuScreen(props: {
  cart: CartItem[]
  categories: string[]
  error?: string
  loading: boolean
  menuRows: MenuItem[]
  onAdd: (item: MenuItem) => void
  onOpenCart: () => void
  onOpenDetail: (item: MenuItem) => void
  onOpenInfo: () => void
  onRefetch: () => void
  search: string
  selectedCategory: string
  setSearch: (value: string) => void
  setSelectedCategory: (value: string) => void
  shopName: string
  tableRef: string
  totalPrice: number
  totalQuantity: number
  visibleRows: MenuItem[]
}) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const line of props.cart) {
      const item = props.menuRows.find((row) => row.id === line.id)
      if (item?.category) counts.set(item.category, (counts.get(item.category) ?? 0) + line.quantity)
    }
    return counts
  }, [props.cart, props.menuRows])

  return (
    <section className="screen menu-screen">
      <header className="mini-topbar">
        <div className="search-pill">
          <Search size={18} />
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="Search menu"
          />
        </div>
      </header>

      <section className="shop-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1>{props.shopName}</h1>
            <p>Table {props.tableRef}</p>
          </div>
          <button
            type="button"
            onClick={props.onOpenInfo}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[13px] font-bold text-neutral-500"
          >
            View
            <ChevronDown size={15} />
          </button>
        </div>
        <div className="shop-welcome">Welcome. Order and pay from your phone.</div>
      </section>

      {props.error ? (
        <div className="inline-error">
          <span>{props.error}</span>
          <button type="button" onClick={props.onRefetch}>Retry</button>
        </div>
      ) : null}

      <div className="menu-layout">
        <aside className="category-rail">
          {props.categories.map((category) => {
            const active = category === props.selectedCategory
            const count =
              category === 'All'
                ? props.totalQuantity
                : categoryCounts.get(category) ?? 0
            return (
              <button
                type="button"
                key={category}
                className={active ? 'active' : ''}
                onClick={() => props.setSelectedCategory(category)}
              >
                <span>{category}</span>
                {count > 0 ? <b>{count}</b> : null}
              </button>
            )
          })}
        </aside>

        <div className="product-list">
          {props.loading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={28} />
              Loading menu
            </div>
          ) : props.visibleRows.length === 0 ? (
            <div className="empty-card">No menu items found.</div>
          ) : (
            props.visibleRows.map((item) => (
              <article className="product-row" key={item.id}>
                <button
                  type="button"
                  className="product-media"
                  onClick={() => props.onOpenDetail(item)}
                  aria-label={`View ${item.name}`}
                >
                  <img src={resolveProductImageUrl(item.imageUrl)} alt="" />
                </button>
                <div className="product-info">
                  <button
                    type="button"
                    className="product-name"
                    onClick={() => props.onOpenDetail(item)}
                  >
                    {item.name}
                  </button>
                  <span className="member-chip">Member price</span>
                  <div className="product-bottom">
                    <strong>{formatBirr(item.unitPrice)}</strong>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => props.onAdd(item)}
                      aria-label={`Add ${item.name}`}
                    >
                      <Plus size={22} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {props.totalQuantity > 0 ? (
        <button type="button" className="floating-cart" onClick={props.onOpenCart}>
          <span className="cart-bubble">
            <ShoppingCart size={24} />
            <b>{props.totalQuantity}</b>
          </span>
          <span className="cart-label">View cart</span>
          <strong>{formatBirr(props.totalPrice)}</strong>
        </button>
      ) : null}
    </section>
  )
}

function ShopInfoSheet({
  onClose,
  shopName,
  tableRef,
}: {
  onClose: () => void
  shopName: string
  tableRef: string
}) {
  return (
    <div className="sheet-backdrop">
      <section
        className="w-full max-w-[480px] rounded-t-[18px] bg-white px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-5 text-neutral-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <header className="grid grid-cols-[40px_1fr_40px] items-center">
          <span />
          <h2 className="m-0 text-center text-[21px] font-black leading-tight">{shopName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full text-neutral-400"
            aria-label="Close restaurant info"
          >
            <X size={25} />
          </button>
        </header>

        <div className="mt-6 space-y-7">
          <section>
            <h3 className="mb-4 text-[19px] font-black">Restaurant info</h3>
            <dl className="space-y-3 text-[14px] leading-6 text-neutral-500">
              <div className="grid grid-cols-[86px_1fr] gap-3">
                <dt>Hours</dt>
                <dd>Daily 8:00 - 22:00</dd>
              </div>
              <div className="grid grid-cols-[86px_1fr] gap-3">
                <dt>Address</dt>
                <dd>E-Joy demo restaurant, table {tableRef}</dd>
              </div>
              <div className="grid grid-cols-[86px_1fr] gap-3">
                <dt>Phone</dt>
                <dd>+251 900 000 000</dd>
              </div>
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 text-[15px] font-bold text-neutral-600"
              >
                <Phone size={17} className="text-[#d29a31]" />
                Call
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 text-[15px] font-bold text-neutral-600"
              >
                <MapPin size={17} className="text-[#d29a31]" />
                Navigate
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[19px] font-black">Notice</h3>
            <p className="m-0 text-[15px] leading-6 text-neutral-500">
              Welcome. Order and pay with Telebirr from this table.
            </p>
          </section>
        </div>
      </section>
    </div>
  )
}

function ItemDetailSheet({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItem
  onAdd: (quantity: number, remark: string) => void
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [spice, setSpice] = useState('Mild')
  const [note, setNote] = useState('')
  const remark = [spice, note.trim()].filter(Boolean).join(' - ')

  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="item-sheet" role="dialog" aria-modal="true">
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
          <X size={26} />
        </button>
        <img className="sheet-image" src={resolveProductImageUrl(item.imageUrl)} alt="" />
        <div className="sheet-body">
          <h2>{item.name}</h2>
          <div className="option-section">
            <p>Spice level</p>
            <div className="option-grid">
              {SPICE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={option === spice ? 'selected' : ''}
                  onClick={() => setSpice(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="note-field">
            <span>Note</span>
            <textarea
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Taste, allergy, or serving request"
            />
          </label>
          <div className="sheet-purchase">
            <strong>{formatBirr(item.unitPrice)}</strong>
            <QuantityStepper
              onDecrement={() => setQuantity((v) => Math.max(1, v - 1))}
              onIncrement={() => setQuantity((v) => v + 1)}
              quantity={quantity}
            />
          </div>
          <button
            type="button"
            className="primary-pill"
            onClick={() => onAdd(quantity, remark)}
          >
            Add to cart
          </button>
        </div>
      </section>
    </div>
  )
}

function CartSheet(props: {
  cart: CartItem[]
  checkoutLoading: boolean
  deleteItem: (id: string, remark?: string) => void
  incrementItem: (id: string, remark?: string) => void
  lastOrder: CreatedOrderModel | null
  note: string
  onClear: () => void
  onClose: () => void
  onPay: () => Promise<void>
  removeItem: (id: string, remark?: string) => void
  setNote: (value: string) => void
  totalPrice: number
  totalQuantity: number
}) {
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    try {
      await props.onPay()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  return (
    <div className="sheet-backdrop">
      <section className="cart-sheet" role="dialog" aria-modal="true">
        <header className="cart-header">
          <button type="button" onClick={props.onClose} aria-label="Back">
            <ArrowLeft size={24} />
          </button>
          <h2>Cart</h2>
          <button type="button" onClick={props.onClear} aria-label="Clear cart">
            <Trash2 size={22} />
          </button>
        </header>
        <div className="cart-context">
          <UtensilsCrossed size={20} />
          <span>{props.totalQuantity} items selected</span>
        </div>
        <div className="cart-list">
          {props.cart.map((line) => (
            <article className="cart-line" key={buildCartKey(line.id, line.remark)}>
              <div>
                <h3>{line.name}</h3>
                {line.remark ? <p>{line.remark}</p> : null}
                <strong>{formatBirr(line.price)}</strong>
              </div>
              <QuantityStepper
                onDecrement={() => props.removeItem(line.id, line.remark)}
                onIncrement={() => props.incrementItem(line.id, line.remark)}
                quantity={line.quantity}
              />
              <button
                type="button"
                className="line-delete"
                onClick={() => props.deleteItem(line.id, line.remark)}
                aria-label={`Remove ${line.name}`}
              >
                <X size={18} />
              </button>
            </article>
          ))}
        </div>
        <div className="cart-total">
          <span>Total</span>
          <strong>{formatBirr(props.totalPrice)}</strong>
        </div>
        <label className="order-note">
          <span>Order note</span>
          <textarea
            maxLength={120}
            value={props.note}
            onChange={(e) => props.setNote(e.target.value)}
            placeholder="Write taste or serving requests"
          />
        </label>
        {props.lastOrder ? (
          <p className="success-note">Last order: {props.lastOrder.orderNo}</p>
        ) : null}
        {error ? <p className="checkout-error">{error}</p> : null}
        <footer className="cart-actions">
          <button type="button" className="secondary-pill" onClick={props.onClose}>
            Continue ordering
          </button>
          <button
            type="button"
            className="primary-pill"
            disabled={!props.cart.length || props.checkoutLoading}
            onClick={() => void submit()}
          >
            {props.checkoutLoading ? 'Processing...' : 'Pay with Telebirr'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function OrdersScreen({
  loading,
  onGoOrder,
  onOpenOrder,
  onRefresh,
  orders,
  paymentMessage,
}: {
  loading: boolean
  onGoOrder: () => void
  onOpenOrder: (id: string) => void
  onRefresh: () => void
  orders: GetOrdersData['getOrders']
  paymentMessage: string | null
}) {
  const [orderMode, setOrderMode] = useState<'dine' | 'stored'>('dine')
  const visibleOrders = orderMode === 'dine' ? orders : []

  return (
    <section className="screen simple-screen">
      <header className="page-title">
        <h1>Orders</h1>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </header>
      <div className="mt-3 flex h-11 items-end gap-9 border-b border-neutral-100">
        {[
          ['dine', 'Dine-in'],
          ['stored', 'Stored value'],
        ].map(([id, label]) => {
          const active = orderMode === id
          return (
            <button
              type="button"
              key={id}
              onClick={() => setOrderMode(id as 'dine' | 'stored')}
              className={`relative h-11 border-0 bg-transparent px-0 text-[19px] font-black ${
                active ? 'text-neutral-950' : 'text-neutral-500'
              }`}
            >
              {label}
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#d29a31]" />
              ) : null}
            </button>
          )
        })}
      </div>
      {paymentMessage ? <div className="success-banner">{paymentMessage}</div> : null}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={28} />
          Loading orders
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="empty-orders">
          <ClipboardList size={86} />
          {orderMode === 'dine' ? <p>You do not have orders yet.</p> : null}
          <button type="button" onClick={onGoOrder}>Go order</button>
        </div>
      ) : (
        <div className="order-list">
          {visibleOrders.map((order) => (
            <button
              type="button"
              key={order.id}
              className="order-card"
              onClick={() => onOpenOrder(order.id)}
            >
              <span>{new Date(order.createdAt).toLocaleString()}</span>
              <strong>{formatBirr(order.totalAmount)}</strong>
              <p>{order.items.length} items - {order.status}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function ProfileScreen({
  onClearSession,
  onGoOrders,
  shopId,
  tableRef,
}: {
  onClearSession: () => void
  onGoOrders: () => void
  shopId: string
  tableRef: string
}) {
  return (
    <section className="screen simple-screen profile-screen">
      <div className="profile-hero">
        <div className="avatar">
          <UserCircle size={54} />
        </div>
        <div>
          <h1>Welcome</h1>
          <p>Telebirr mini app guest</p>
        </div>
      </div>
      <div className="profile-card">
        <h2>Current table</h2>
        <p>Shop: {shopId}</p>
        <p>Table: {tableRef}</p>
      </div>
      <div className="profile-list">
        <button type="button" onClick={onGoOrders}>
          <ReceiptText size={22} />
          My orders
        </button>
        <button type="button">
          <Info size={22} />
          About this restaurant
        </button>
        <button type="button" onClick={onClearSession} className="danger">
          <Trash2 size={22} />
          Clear table session
        </button>
      </div>
    </section>
  )
}

function QuantityStepper({
  onDecrement,
  onIncrement,
  quantity,
}: {
  onDecrement: () => void
  onIncrement: () => void
  quantity: number
}) {
  return (
    <div className="quantity-stepper">
      <button type="button" onClick={onDecrement} aria-label="Decrease quantity">
        <Minus size={18} />
      </button>
      <span>{quantity}</span>
      <button type="button" onClick={onIncrement} aria-label="Increase quantity">
        <Plus size={18} />
      </button>
    </div>
  )
}

function BottomTabs({
  activeTab,
  onSelect,
  totalQuantity,
}: {
  activeTab: Tab
  onSelect: (tab: Tab) => void
  totalQuantity: number
}) {
  const tabs: Array<{ id: Tab; Icon: typeof Home }> = [
    { id: 'home', Icon: Home },
    { id: 'menu', Icon: UtensilsCrossed },
    { id: 'orders', Icon: ReceiptText },
    { id: 'profile', Icon: UserCircle },
  ]
  return (
    <nav className="bottom-tabs">
      {tabs.map(({ id, Icon }) => {
        const active = id === activeTab
        return (
          <button
            key={id}
            type="button"
            className={active ? 'active' : ''}
            onClick={() => onSelect(id)}
          >
            <span>
              <Icon size={24} />
              {id === 'menu' && totalQuantity > 0 ? <b>{totalQuantity}</b> : null}
            </span>
            {tabLabel(id)}
          </button>
        )
      })}
    </nav>
  )
}
