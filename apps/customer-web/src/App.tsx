import { useMutation, useQuery } from '@apollo/client/react'
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Home,
  Info,
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
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CREATE_ORDER_MUTATION } from './graphql/createOrder'
import { CUSTOMER_SHOP, type CustomerShopRow } from './graphql/customerShop'
import { GET_ORDERS_QUERY, type GetOrdersData } from './graphql/getOrders'
import { SHOP_MENU, type ShopMenuProduct } from './graphql/shopMenu'
import { useTableSession } from './hooks/useTableSession'
import { getCustomerThemeVars, resolveCustomerThemePreset } from './lib/customerTheme'
import { buildMockTelebirrRedirectUrl, getOrderServiceHttpOrigin } from './lib/mockTelebirrRedirectUrl'
import { cn } from './lib/utils'
import {
  useCartStore,
  useCartTotalPrice,
  useCartTotalQuantity,
  type CartItem,
} from './store/useCartStore'
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

  const { data: shopData } = useQuery<{ customerShop: CustomerShopRow | null }>(
    CUSTOMER_SHOP,
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
      toast.success('Payment received. Your order was sent to the kitchen.')
      setActiveTab('orders')
      clearCart()
      window.history.replaceState({}, document.title, '/')
    }
  }, [clearCart])

  const menuRows = data?.shopMenu ?? []
  const shop = shopData?.customerShop ?? null
  const shopName = shop?.name?.trim() || 'E-Joy Restaurant'
  const customerThemePreset = resolveCustomerThemePreset(shop?.customerThemePreset)
  const customerThemeVars = getCustomerThemeVars(shop?.customerThemeOverrides)
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
    window.location.href = buildMockTelebirrRedirectUrl(
      payload.order.id,
      payload.order.totalAmount,
    )
  }

  if (!hasTableSession) {
    return <MissingQrScreen />
  }

  return (
    <main
      className="min-h-svh bg-background text-foreground"
      data-theme={customerThemePreset}
      style={customerThemeVars}
    >
      <div className="relative mx-auto min-h-svh w-full max-w-[480px] overflow-hidden bg-background">
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
            onAdd={(item) => {
              addItem({ id: item.id, name: item.name, price: item.unitPrice })
            }}
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

      <ItemDetailDrawer
        item={detailItem}
        onOpenChange={(open) => {
          if (!open) setDetailItem(null)
        }}
        onAdd={(quantity, remark) => {
          if (!detailItem) return
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

      <CartDrawer
        cart={cart}
        checkoutLoading={checkoutLoading}
        deleteItem={deleteItem}
        incrementItem={incrementItem}
        lastOrder={lastOrder}
        note={orderNote}
        onClear={clearCart}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onPay={payWithTelebirr}
        removeItem={removeItem}
        setNote={setOrderNote}
        totalPrice={totalPrice}
        totalQuantity={totalQuantity}
      />

      <ShopInfoDrawer
        open={shopInfoOpen}
        shopName={shopName}
        tableRef={tableRef}
        onOpenChange={setShopInfoOpen}
      />
    </main>
  )
}

function HomeScreen({ onStart, shopName }: { onStart: () => void; shopName: string }) {
  return (
    <section className="relative min-h-svh overflow-hidden bg-black text-white">
      <img
        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=82"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black" />
      <div className="relative flex min-h-svh flex-col px-7 pb-[calc(104px+env(safe-area-inset-bottom))] pt-[calc(42px+env(safe-area-inset-top))]">
        <Badge className="ml-auto bg-white/90 text-neutral-900" variant="secondary">
          Table ordering
        </Badge>
        <div className="mt-auto flex flex-col gap-3">
          <h1 className="max-w-[12ch] text-[34px] font-black leading-[1.06]">
            {shopName}
          </h1>
          <p className="max-w-[260px] text-[15px] font-medium leading-6 text-white/80">
            Browse the menu, pay with Telebirr, and we bring the order to your table.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={onStart}
            className="mt-5 h-14 rounded-full text-[18px] font-black shadow-xl"
          >
            Start ordering
          </Button>
        </div>
      </div>
    </section>
  )
}

function MissingQrScreen() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground" style={getCustomerThemeVars()}>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.66)),url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
      <Card className="w-full max-w-[390px] bg-card/95 text-center shadow-xl">
        <CardHeader className="items-center">
          <EmptyMedia variant="icon" className="size-20 rounded-[26px] bg-secondary text-secondary-foreground">
            <UtensilsCrossed />
          </EmptyMedia>
          <CardTitle className="text-[25px] font-black">Scan your table QR code</CardTitle>
          <CardDescription className="max-w-[290px] text-[15px] leading-6">
            Open this mini app from the QR code on your table so we know where to send your food.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <span>Local demo URL:</span>
            <code className="break-words text-foreground">?shopId=test-shop-001&amp;table=test-table-001</code>
          </div>
        </CardContent>
      </Card>
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
    <section className="flex h-svh min-h-svh flex-col overflow-hidden pb-[84px]">
      <header className="sticky top-0 z-20 bg-gradient-to-b from-secondary to-background px-3 pb-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <InputGroup className="h-11 w-[min(72%,300px)] rounded-full border-transparent bg-card/95">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
          />
        </InputGroup>
      </header>

      <Card className="mx-3 mt-3 rounded-b-none shadow-none">
        <CardHeader>
          <CardTitle className="truncate text-[21px] font-black">{props.shopName}</CardTitle>
          <CardDescription>Table {props.tableRef}</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={props.onOpenInfo}>
              View
              <ChevronDown data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-[15px] text-foreground/80">
          Welcome. Order and pay from your phone.
        </CardContent>
      </Card>

      {props.error ? (
        <Alert variant="destructive" className="mx-3 my-2 w-auto">
          <AlertTitle>Menu could not load</AlertTitle>
          <AlertDescription>{props.error}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="ghost" size="sm" onClick={props.onRefetch}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-[96px_minmax(0,1fr)] overflow-hidden bg-card max-[380px]:grid-cols-[84px_minmax(0,1fr)]">
        <aside className="overflow-y-auto bg-muted/75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ToggleGroup
            value={[props.selectedCategory]}
            onValueChange={(value) => {
              const next = value.at(-1)
              if (next) props.setSelectedCategory(next)
            }}
            className="flex w-full flex-col gap-0 rounded-none p-0"
          >
            {props.categories.map((category) => {
              const count =
                category === 'All'
                  ? props.totalQuantity
                  : categoryCounts.get(category) ?? 0
              return (
                  <ToggleGroupItem
                  key={category}
                  value={category}
                  className="relative h-[72px] w-full rounded-none border-l-4 border-transparent px-2 text-center text-[13px] font-bold leading-tight data-[state=on]:border-primary data-[state=on]:bg-card data-[state=on]:text-primary max-[380px]:h-[68px]"
                >
                  <span className="line-clamp-2">{category}</span>
                  {count > 0 ? (
                    <Badge className="absolute right-1.5 top-1.5 min-w-5 justify-center px-1 text-[10px]" variant="destructive">
                      {count}
                    </Badge>
                  ) : null}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </aside>

        <div className="min-w-0 overflow-y-auto px-2 pb-28 pt-2 [scrollbar-color:var(--primary)_transparent]">
          {props.loading ? (
            <MenuSkeleton />
          ) : props.visibleRows.length === 0 ? (
            <Empty className="min-h-[260px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No menu items found</EmptyTitle>
                <EmptyDescription>Try another search or category.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {props.visibleRows.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={() => props.onAdd(item)}
                  onOpen={() => props.onOpenDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {props.totalQuantity > 0 ? (
        <Button
          type="button"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] left-[max(12px,calc((100vw-480px)/2+12px))] z-40 h-14 min-w-[236px] max-w-[calc(100vw-24px)] justify-start gap-3 rounded-full bg-card px-2 pr-4 text-primary shadow-xl hover:bg-card"
          onClick={props.onOpenCart}
        >
          <span className="relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShoppingCart />
            <Badge className="absolute -right-2 -top-2 min-w-5 justify-center px-1 text-[10px]" variant="destructive">
              {props.totalQuantity}
            </Badge>
          </span>
          <span className="text-[17px] font-black">View cart</span>
          <strong className="ml-auto text-xs text-foreground">{formatBirr(props.totalPrice)}</strong>
        </Button>
      ) : null}
    </section>
  )
}

function MenuSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} size="sm">
          <CardContent className="grid grid-cols-[106px_minmax(0,1fr)] gap-3 p-2 max-[380px]:grid-cols-[88px_minmax(0,1fr)]">
            <Skeleton className="size-[106px] rounded-lg max-[380px]:size-[88px]" />
            <div className="flex min-w-0 flex-col gap-3 py-1">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-24" />
              <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProductCard({
  item,
  onAdd,
  onOpen,
}: {
  item: MenuItem
  onAdd: () => void
  onOpen: () => void
}) {
  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="grid min-h-[142px] grid-cols-[106px_minmax(0,1fr)] gap-3 p-2 max-[380px]:grid-cols-[88px_minmax(0,1fr)]">
        <button
          type="button"
          className="size-[106px] overflow-hidden rounded-lg bg-muted max-[380px]:size-[88px]"
          onClick={onOpen}
          aria-label={`View ${item.name}`}
        >
          <img src={resolveProductImageUrl(item.imageUrl)} alt="" className="size-full object-cover" />
        </button>
        <div className="flex min-w-0 flex-col items-start">
          <button
            type="button"
            className="line-clamp-2 min-h-10 text-left text-[17px] font-black leading-tight text-foreground max-[380px]:text-[16px]"
            onClick={onOpen}
          >
            {item.name}
          </button>
          <Badge variant="secondary" className="mt-2">Member price</Badge>
          <div className="mt-auto flex w-full items-center justify-between gap-2">
            <strong className="text-[18px] font-black">{formatBirr(item.unitPrice)}</strong>
            <Button type="button" size="icon-lg" className="rounded-full" onClick={onAdd} aria-label={`Add ${item.name}`}>
              <Plus />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ShopInfoDrawer({
  onOpenChange,
  open,
  shopName,
  tableRef,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
  shopName: string
  tableRef: string
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[88svh] w-full max-w-[480px] rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <DrawerHeader className="grid grid-cols-[40px_1fr_40px] items-center text-center">
          <span />
          <div>
            <DrawerTitle className="text-[20px] font-black">{shopName}</DrawerTitle>
            <DrawerDescription>Table {tableRef}</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Close restaurant info">
            <X />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex flex-col gap-6 px-4 pb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black">Restaurant info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-[14px] leading-6 text-muted-foreground">
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
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-12 rounded-full">
                <Phone data-icon="inline-start" />
                Call
              </Button>
              <Button type="button" variant="outline" className="h-12 rounded-full">
                <MapPin data-icon="inline-start" />
                Navigate
              </Button>
            </CardFooter>
          </Card>
          <Alert>
            <Info />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>Welcome. Order and pay with Telebirr from this table.</AlertDescription>
          </Alert>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ItemDetailDrawer({
  item,
  onAdd,
  onOpenChange,
}: {
  item: MenuItem | null
  onAdd: (quantity: number, remark: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [spice, setSpice] = useState('Mild')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!item) return
    setQuantity(1)
    setSpice('Mild')
    setNote('')
  }, [item])

  const remark = [spice, note.trim()].filter(Boolean).join(' - ')

  return (
    <Drawer open={Boolean(item)} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[92svh] w-full max-w-[480px] overflow-hidden rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {item ? (
          <>
            <div className="relative overflow-hidden rounded-t-2xl">
              <img className="h-[min(42svh,360px)] w-full object-cover" src={resolveProductImageUrl(item.imageUrl)} alt="" />
              <DrawerClose asChild>
                <Button type="button" variant="secondary" size="icon-lg" className="absolute right-4 top-4 rounded-full" aria-label="Close">
                <X />
                </Button>
              </DrawerClose>
            </div>
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-[25px] font-black">{item.name}</DrawerTitle>
              <DrawerDescription>{formatBirr(item.unitPrice)}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Spice level</FieldLegend>
                  <ToggleGroup
                    value={[spice]}
                    onValueChange={(value) => {
                      const next = value.at(-1)
                      if (next) setSpice(next)
                    }}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {SPICE_OPTIONS.map((option) => (
                      <ToggleGroupItem key={option} value={option} className="min-w-[92px]">
                        {option}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FieldSet>
                <Field>
                  <FieldLabel htmlFor="item-note">Note</FieldLabel>
                  <InputGroup className="min-h-[92px]">
                    <InputGroupTextarea
                      id="item-note"
                      maxLength={80}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Taste, allergy, or serving request"
                    />
                  </InputGroup>
                  <FieldDescription>{80 - note.length} characters left</FieldDescription>
                </Field>
              </FieldGroup>
            </div>
            <DrawerFooter>
              <div className="flex items-center justify-between">
                <strong className="text-[25px] font-black text-primary">{formatBirr(item.unitPrice)}</strong>
                <QuantityStepper
                  onDecrement={() => setQuantity((v) => Math.max(1, v - 1))}
                  onIncrement={() => setQuantity((v) => v + 1)}
                  quantity={quantity}
                />
              </div>
              <Button type="button" className="h-13 rounded-full text-[16px] font-black" onClick={() => onAdd(quantity, remark)}>
                Add to cart
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

function CartDrawer(props: {
  cart: CartItem[]
  checkoutLoading: boolean
  deleteItem: (id: string, remark?: string) => void
  incrementItem: (id: string, remark?: string) => void
  lastOrder: CreatedOrderModel | null
  note: string
  onClear: () => void
  onOpenChange: (open: boolean) => void
  onPay: () => Promise<void>
  open: boolean
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
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Drawer open={props.open} onOpenChange={props.onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90svh] w-full max-w-[480px] overflow-hidden rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <DrawerHeader className="grid grid-cols-[40px_1fr_40px] items-center text-center">
          <DrawerClose asChild>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Back">
            <ArrowLeft />
            </Button>
          </DrawerClose>
          <div>
            <DrawerTitle className="text-[21px] font-black">Cart</DrawerTitle>
            <DrawerDescription>{props.totalQuantity} items selected</DrawerDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-lg" onClick={props.onClear} aria-label="Clear cart">
            <Trash2 />
          </Button>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <Alert className="mb-3">
            <UtensilsCrossed />
            <AlertTitle>Dine-in order</AlertTitle>
            <AlertDescription>Your order is linked to this table.</AlertDescription>
          </Alert>

          {props.cart.length === 0 ? (
            <Empty className="min-h-[220px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart />
                </EmptyMedia>
                <EmptyTitle>Your cart is empty</EmptyTitle>
                <EmptyDescription>Add items from the menu to continue.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-0 p-0">
                {props.cart.map((line, index) => (
                  <div key={buildCartKey(line.id, line.remark)}>
                    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-black">{line.name}</h3>
                        {line.remark ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{line.remark}</p> : null}
                        <strong className="mt-2 block text-[18px] font-black">{formatBirr(line.price)}</strong>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => props.deleteItem(line.id, line.remark)}
                          aria-label={`Remove ${line.name}`}
                        >
                          <X />
                        </Button>
                        <QuantityStepper
                          onDecrement={() => props.removeItem(line.id, line.remark)}
                          onIncrement={() => props.incrementItem(line.id, line.remark)}
                          quantity={line.quantity}
                        />
                      </div>
                    </article>
                    {index < props.cart.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="mt-3">
            <CardContent className="flex items-baseline justify-between">
              <span className="text-[16px] text-muted-foreground">Total</span>
              <strong className="text-[25px] font-black">{formatBirr(props.totalPrice)}</strong>
            </CardContent>
          </Card>

          <Field className="mt-3">
            <FieldLabel htmlFor="order-note">Order note</FieldLabel>
            <InputGroup className="min-h-[92px] bg-card">
              <InputGroupTextarea
                id="order-note"
                maxLength={120}
                value={props.note}
                onChange={(e) => props.setNote(e.target.value)}
                placeholder="Write taste or serving requests"
              />
            </InputGroup>
          </Field>

          {props.lastOrder ? (
            <Alert className="mt-3 border-green-200 bg-green-50 text-green-800">
              <AlertTitle>Last order: {props.lastOrder.orderNo}</AlertTitle>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>Checkout failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DrawerFooter className="grid grid-cols-[0.78fr_1.42fr] gap-3">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="h-13 rounded-full">
              Continue ordering
            </Button>
          </DrawerClose>
          <Button
            type="button"
            className="h-13 rounded-full font-black"
            disabled={!props.cart.length || props.checkoutLoading}
            onClick={() => void submit()}
          >
            {props.checkoutLoading ? (
              <>
                <Spinner data-icon="inline-start" />
                Processing...
              </>
            ) : (
              'Pay with Telebirr'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function OrdersScreen({
  loading,
  onGoOrder,
  onOpenOrder,
  onRefresh,
  orders,
}: {
  loading: boolean
  onGoOrder: () => void
  onOpenOrder: (id: string) => void
  onRefresh: () => void
  orders: GetOrdersData['getOrders']
}) {
  const [orderMode, setOrderMode] = useState<'dine' | 'stored'>('dine')
  const visibleOrders = orderMode === 'dine' ? orders : []

  return (
    <section className="min-h-svh bg-card px-4 pb-28 pt-[calc(env(safe-area-inset-top)+18px)]">
      <header className="flex min-h-12 items-center justify-between">
        <h1 className="text-[25px] font-black">Orders</h1>
        <Button type="button" variant="ghost" onClick={onRefresh}>Refresh</Button>
      </header>
      <Tabs value={orderMode} onValueChange={(value) => setOrderMode(value as 'dine' | 'stored')} className="mt-3">
        <TabsList variant="line" className="h-11 gap-8">
          <TabsTrigger value="dine" className="text-[18px] font-black">Dine-in</TabsTrigger>
          <TabsTrigger value="stored" className="text-[18px] font-black">Stored value</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <LoadingState label="Loading orders" />
      ) : visibleOrders.length === 0 ? (
        <Empty className="min-h-[65svh] border-0">
          <EmptyHeader>
            <EmptyMedia>
              <ClipboardList className="size-20 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-[18px]">You do not have orders yet.</EmptyTitle>
            <EmptyDescription>Placed orders will show up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" className="h-12 w-[220px] rounded-full" onClick={onGoOrder}>
              Go order
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {visibleOrders.map((order) => (
            <Card key={order.id}>
              <button
                type="button"
                className="flex flex-col gap-2 p-4 text-left"
                onClick={() => onOpenOrder(order.id)}
              >
                <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</span>
                <strong className="text-[21px] font-black">{formatBirr(order.totalAmount)}</strong>
                <p className="m-0 text-sm text-muted-foreground">{order.items.length} items - {order.status}</p>
              </button>
            </Card>
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
    <section className="min-h-svh bg-[linear-gradient(180deg,var(--secondary)_0,var(--background)_210px,var(--card)_100%)] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+96px)]">
      <Card>
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="grid size-[70px] place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <UserCircle />
          </div>
          <div className="min-w-0">
            <h1 className="text-[23px] font-black">Welcome</h1>
            <p className="text-muted-foreground">Telebirr mini app guest</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="text-lg font-black">Current table</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Shop: {shopId}</p>
          <p>Table: {tableRef}</p>
        </CardContent>
      </Card>
      <Card className="mt-3">
        <CardContent className="flex flex-col p-0">
          <ProfileAction onClick={onGoOrders} icon={<ReceiptText />} label="My orders" />
          <Separator />
          <ProfileAction icon={<Info />} label="About this restaurant" />
          <Separator />
          <ProfileAction danger onClick={onClearSession} icon={<Trash2 />} label="Clear table session" />
        </CardContent>
      </Card>
    </section>
  )
}

function ProfileAction({
  danger,
  icon,
  label,
  onClick,
}: {
  danger?: boolean
  icon: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn('h-16 justify-start gap-3 rounded-none px-4 text-[16px] font-bold', danger && 'text-destructive hover:text-destructive')}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center text-center font-bold text-muted-foreground">
      <div className="flex items-center gap-2">
        <Spinner />
        {label}
      </div>
    </div>
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
    <div className="inline-flex items-center gap-3">
      <Button type="button" variant="outline" size="icon-lg" className="rounded-full" onClick={onDecrement} aria-label="Decrease quantity">
        <Minus />
      </Button>
      <span className="min-w-6 text-center text-[19px] font-black tabular-nums">{quantity}</span>
      <Button type="button" size="icon-lg" className="rounded-full" onClick={onIncrement} aria-label="Increase quantity">
        <Plus />
      </Button>
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
    <Tabs value={activeTab} onValueChange={(value) => onSelect(value as Tab)} className="fixed bottom-0 left-1/2 z-[35] w-[min(480px,100vw)] -translate-x-1/2">
      <TabsList className="grid h-auto w-full grid-cols-4 rounded-none border-t bg-card/95 p-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-8px_20px_rgba(0,0,0,0.04)] backdrop-blur">
        {tabs.map(({ id, Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-12 flex-col gap-1 rounded-lg text-[11px] font-bold data-active:text-primary"
          >
            <span className="relative grid min-h-6 place-items-center">
              <Icon />
              {id === 'menu' && totalQuantity > 0 ? (
                <Badge className="absolute -right-3 -top-2 min-w-4 justify-center px-1 text-[9px]" variant="destructive">
                  {totalQuantity}
                </Badge>
              ) : null}
            </span>
            {tabLabel(id)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
