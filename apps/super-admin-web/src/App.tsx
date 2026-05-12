import { gql } from '@apollo/client'
import { ApolloProvider, useMutation, useQuery } from '@apollo/client/react'
import {
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Megaphone,
  Power,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { apolloClient, SUPER_ADMIN_TOKEN_KEY } from './lib/apollo'

type Page = 'dashboard' | 'applications' | 'restaurants' | 'marketing' | 'operations' | 'audit'
type Status = 'PENDING' | 'APPROVED' | 'REJECTED'
type ShopStatus = 'ONLINE' | 'OFFLINE'

type PlatformMe = {
  id: string
  name: string
  identifier: string
  platformRole: string
  scope: string[]
}
type Dashboard = {
  totalShops: number
  activeShops: number
  pendingApplications: number
  totalOrders: number
  paidOrders: number
  failedPayments: number
  totalRevenueCent: number
}
type Application = {
  id: string
  shopName: string
  contactName: string
  contactPhone: string
  status: Status
  rejectReason?: string | null
  createdShopId?: string | null
}
type ManagedShop = {
  id: string
  name: string
  status: ShopStatus
  updatedAt: string
  updatedBy?: string | null
  orderCount: number
  revenueCent: number
}
type ManagedShopDetail = {
  shop: ManagedShop
  managers: Array<{ id: string; name: string; phone: string; role: string; status: string }>
  paymentConfig?: {
    id: string
    provider: string
    merchantId?: string | null
    appId?: string | null
    enabled: boolean
    testMode: boolean
    updatedBy?: string | null
  } | null
}
type Coupon = {
  id: string
  code: string
  discountValue: number
  status: string
  ruleType: string
  minOrderAmount?: number | null
}
type Banner = {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string | null
  status: string
  createdAt: string
}
type AuditLog = {
  id: string
  actorId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  metadata?: string | null
  createdAt: string
}

const PLATFORM_LOGIN = gql`
  mutation PlatformLogin($identifier: String!, $password: String!) {
    platformLogin(identifier: $identifier, password: $password) {
      accessToken
      role
      scope
    }
  }
`

const PLATFORM_ME = gql`
  query PlatformMe {
    platformMe {
      id
      name
      identifier
      platformRole
      scope
    }
  }
`

const DASHBOARD = gql`
  query PlatformDashboard {
    platformDashboard {
      totalShops
      activeShops
      pendingApplications
      totalOrders
      paidOrders
      failedPayments
      totalRevenueCent
    }
  }
`

const APPLICATIONS = gql`
  query ShopApplications($status: ApplicationStatusModel) {
    shopApplications(status: $status) {
      id
      shopName
      contactName
      contactPhone
      status
      rejectReason
      createdShopId
    }
  }
`

const APPROVE_APPLICATION = gql`
  mutation ApproveShopApplication($shopId: String!, $input: ApproveShopApplicationInput) {
    approveShopApplication(shopId: $shopId, input: $input) {
      ok
      shopId
      managerStaffId
      temporaryPassword
    }
  }
`

const REJECT_APPLICATION = gql`
  mutation RejectShopApplication($shopId: String!, $reason: String!) {
    rejectShopApplication(shopId: $shopId, reason: $reason)
  }
`

const SHOPS = gql`
  query ManagedShops($filter: ManagedShopsFilterInput) {
    managedShops(filter: $filter) {
      id
      name
      status
      updatedAt
      updatedBy
      orderCount
      revenueCent
    }
  }
`

const SHOP_DETAIL = gql`
  query ManagedShop($shopId: String!) {
    managedShop(shopId: $shopId) {
      shop {
        id
        name
        status
        updatedAt
        updatedBy
        orderCount
        revenueCent
      }
      managers {
        id
        name
        phone
        role
        status
      }
      paymentConfig {
        id
        provider
        merchantId
        appId
        enabled
        testMode
        updatedBy
      }
    }
  }
`

const UPDATE_SHOP = gql`
  mutation UpdateManagedShop($shopId: String!, $input: UpdateManagedShopInput!) {
    updateManagedShop(shopId: $shopId, input: $input)
  }
`

const UPDATE_PAYMENT = gql`
  mutation UpdateShopPaymentConfig($shopId: String!, $input: UpdateShopPaymentConfigInput!) {
    updateShopPaymentConfig(shopId: $shopId, input: $input) {
      id
      provider
      merchantId
      appId
      enabled
      testMode
      updatedBy
    }
  }
`

const MARKETING = gql`
  query Marketing {
    platformCoupons {
      id
      code
      discountValue
      status
      ruleType
      minOrderAmount
    }
    banners {
      id
      title
      imageUrl
      linkUrl
      status
      createdAt
    }
  }
`

const CREATE_COUPON = gql`
  mutation CreatePlatformCoupon($input: CreatePlatformCouponInput!) {
    createPlatformCoupon(input: $input) {
      id
      code
    }
  }
`

const CREATE_BANNER = gql`
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      id
      title
    }
  }
`

const DISABLE_BANNER = gql`
  mutation DisableBanner($bannerId: String!) {
    disableBanner(bannerId: $bannerId)
  }
`

const RUN_PRINT_RETRY = gql`
  mutation RunPrintRetryCycle($shopId: String) {
    runPrintRetryCycle(shopId: $shopId) {
      processed
      succeeded
      failed
      alerted
    }
  }
`

const AUDIT_LOGS = gql`
  query PlatformAuditLogs($filter: PlatformAuditLogFilterInput) {
    platformAuditLogs(filter: $filter) {
      id
      actorId
      action
      targetType
      targetId
      metadata
      createdAt
    }
  }
`

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <SuperAdminShell />
    </ApolloProvider>
  )
}

function SuperAdminShell() {
  const [version, setVersion] = useState(0)
  const hasToken = Boolean(sessionStorage.getItem(SUPER_ADMIN_TOKEN_KEY))
  const me = useQuery<{ platformMe: PlatformMe }>(PLATFORM_ME, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  })

  if (!hasToken || me.error) {
    return (
      <LoginScreen
        key={version}
        error={me.error?.message}
        onLoggedIn={() => setVersion((v) => v + 1)}
      />
    )
  }
  if (me.loading && !me.data) {
    return <FullScreenLoader label="Loading super admin console" />
  }
  return <Console session={me.data!.platformMe} onLogout={() => setVersion((v) => v + 1)} />
}

function LoginScreen({ error, onLoggedIn }: { error?: string; onLoggedIn: () => void }) {
  const [identifier, setIdentifier] = useState('owner@ejoy.local')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(error ?? '')
  const [login, loginState] = useMutation<{ platformLogin: { accessToken: string } }>(PLATFORM_LOGIN)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      const result = await login({ variables: { identifier: identifier.trim(), password } })
      const token = result.data?.platformLogin.accessToken
      if (!token) throw new Error('Login failed')
      sessionStorage.setItem(SUPER_ADMIN_TOKEN_KEY, token)
      await apolloClient.resetStore()
      onLoggedIn()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">Super admin login</h1>
            <p className="text-sm text-slate-500">Platform operations for E-Joy.</p>
          </div>
        </div>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email or phone
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        {formError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div> : null}
        <button disabled={loginState.loading || !identifier.trim() || !password.trim()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {loginState.loading ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
          Sign in
        </button>
        <p className="mt-4 text-xs text-slate-500">Local seed default password: Owner@123456</p>
      </form>
    </main>
  )
}

function Console({ session, onLogout }: { session: PlatformMe; onLogout: () => void }) {
  const [page, setPage] = useState<Page>('dashboard')
  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['applications', ClipboardList, 'Applications'],
    ['restaurants', Building2, 'Restaurants'],
    ['marketing', Megaphone, 'Marketing'],
    ['operations', RefreshCw, 'Operations'],
    ['audit', FileClock, 'Audit'],
  ] as const

  function logout() {
    sessionStorage.removeItem(SUPER_ADMIN_TOKEN_KEY)
    void apolloClient.clearStore()
    onLogout()
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:block">
          <div className="border-b border-white/10 p-5">
            <div className="text-lg font-bold">E-Joy Platform</div>
            <div className="mt-1 text-xs text-slate-400">Super admin console</div>
          </div>
          <nav className="space-y-1 p-3">
            {nav.map(([key, Icon, label]) => (
              <button key={key} onClick={() => setPage(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${page === key ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-950">{titleFor(page)}</h1>
                <p className="text-sm text-slate-500">{session.name} · {session.platformRole}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="lg:hidden">
                  <select value={page} onChange={(e) => setPage(e.target.value as Page)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                    {nav.map(([key, , label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>
          <div className="p-4 md:p-6">
            {page === 'dashboard' ? <DashboardPage /> : null}
            {page === 'applications' ? <ApplicationsPage /> : null}
            {page === 'restaurants' ? <RestaurantsPage /> : null}
            {page === 'marketing' ? <MarketingPage /> : null}
            {page === 'operations' ? <OperationsPage /> : null}
            {page === 'audit' ? <AuditPage /> : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function DashboardPage() {
  const { data, loading } = useQuery<{ platformDashboard: Dashboard }>(DASHBOARD)
  if (loading && !data) return <PanelLoader />
  const d = data?.platformDashboard
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Building2} label="Restaurants" value={`${d?.activeShops ?? 0}/${d?.totalShops ?? 0}`} />
        <Metric icon={ClipboardList} label="Pending applications" value={d?.pendingApplications ?? 0} />
        <Metric icon={ReceiptText} label="Orders" value={d?.totalOrders ?? 0} />
        <Metric icon={BadgeDollarSign} label="Revenue" value={formatMoney(d?.totalRevenueCent ?? 0)} />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold">Platform health</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <HealthRow label="Paid orders" value={d?.paidOrders ?? 0} tone="green" />
          <HealthRow label="Failed payments" value={d?.failedPayments ?? 0} tone="red" />
          <HealthRow label="Application backlog" value={d?.pendingApplications ?? 0} tone="blue" />
        </div>
      </section>
    </div>
  )
}

function ApplicationsPage() {
  const [status, setStatus] = useState<Status | ''>('')
  const [lastPassword, setLastPassword] = useState('')
  const query = useQuery<{ shopApplications: Application[] }>(APPLICATIONS, { variables: { status: status || null } })
  const [approve, approveState] = useMutation<{
    approveShopApplication?: { temporaryPassword?: string | null }
  }>(APPROVE_APPLICATION)
  const [reject] = useMutation(REJECT_APPLICATION)
  const apps = query.data?.shopApplications ?? []

  async function approveApp(app: Application) {
    const result = await approve({ variables: { shopId: app.id, input: {} } })
    const password = result.data?.approveShopApplication?.temporaryPassword
    if (password) setLastPassword(`${app.shopName}: ${password}`)
    await query.refetch()
  }

  async function rejectApp(app: Application) {
    const reason = window.prompt(`Reject ${app.shopName}. Reason:`)
    if (!reason) return
    await reject({ variables: { shopId: app.id, reason } })
    await query.refetch()
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <TableHeader title="Restaurant applications" action={<StatusFilter value={status} onChange={setStatus} />} />
      {lastPassword ? <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Temporary manager password: <strong>{lastPassword}</strong></div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Restaurant</th><th>Contact</th><th>Status</th><th>Created shop</th><th className="text-right pr-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {apps.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-3 font-semibold">{app.shopName}</td>
                <td>{app.contactName}<div className="text-xs text-slate-500">{app.contactPhone}</div></td>
                <td><StatusPill status={app.status} /></td>
                <td className="font-mono text-xs text-slate-500">{app.createdShopId ?? '-'}</td>
                <td className="pr-4 text-right">
                  <button disabled={app.status !== 'PENDING' || approveState.loading} onClick={() => void approveApp(app)} className="mr-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Approve</button>
                  <button disabled={app.status !== 'PENDING'} onClick={() => void rejectApp(app)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Reject</button>
                </td>
              </tr>
            ))}
            {apps.length === 0 ? <EmptyRow colSpan={5} label="No applications found." /> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RestaurantsPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const shopsQuery = useQuery<{ managedShops: ManagedShop[] }>(SHOPS, { variables: { filter: { search: search || null } } })
  const [updateShop] = useMutation(UPDATE_SHOP)
  const shops = shopsQuery.data?.managedShops ?? []
  const selected = selectedId || shops[0]?.id || ''

  async function toggleShop(shop: ManagedShop) {
    await updateShop({ variables: { shopId: shop.id, input: { online: shop.status !== 'ONLINE' } } })
    await shopsQuery.refetch()
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="rounded-xl border border-slate-200 bg-white">
        <TableHeader title="Restaurants" action={<SearchBox value={search} onChange={setSearch} />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Name</th><th>Status</th><th>Orders</th><th>Revenue</th><th className="text-right pr-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shops.map((shop) => (
                <tr key={shop.id} className={selected === shop.id ? 'bg-blue-50/60' : ''}>
                  <td className="px-4 py-3"><button onClick={() => setSelectedId(shop.id)} className="font-semibold text-blue-700">{shop.name}</button><div className="font-mono text-xs text-slate-500">{shop.id}</div></td>
                  <td><ShopPill status={shop.status} /></td>
                  <td>{shop.orderCount}</td>
                  <td>{formatMoney(shop.revenueCent)}</td>
                  <td className="pr-4 text-right"><button onClick={() => void toggleShop(shop)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">{shop.status === 'ONLINE' ? 'Disable' : 'Enable'}</button></td>
                </tr>
              ))}
              {shops.length === 0 ? <EmptyRow colSpan={5} label="No restaurants found." /> : null}
            </tbody>
          </table>
        </div>
      </section>
      {selected ? <RestaurantDetail shopId={selected} /> : <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Select a restaurant.</section>}
    </div>
  )
}

function RestaurantDetail({ shopId }: { shopId: string }) {
  const detail = useQuery<{ managedShop: ManagedShopDetail }>(SHOP_DETAIL, { variables: { shopId } })
  const [payment, setPayment] = useState({ provider: 'TELEBIRR', merchantId: '', appId: '', enabled: false, testMode: true })
  const [savePayment] = useMutation(UPDATE_PAYMENT)
  const data = detail.data?.managedShop

  useEffect(() => {
    if (!data?.paymentConfig) return
    setPayment({
      provider: data.paymentConfig.provider,
      merchantId: data.paymentConfig.merchantId ?? '',
      appId: data.paymentConfig.appId ?? '',
      enabled: data.paymentConfig.enabled,
      testMode: data.paymentConfig.testMode,
    })
  }, [data?.paymentConfig])

  async function save() {
    await savePayment({ variables: { shopId, input: payment } })
    await detail.refetch()
  }

  if (detail.loading && !data) return <PanelLoader />
  if (!data) return <section className="rounded-xl border border-slate-200 bg-white p-5">Restaurant not found.</section>
  const qrUrl = `http://localhost:9601/?shopId=${encodeURIComponent(shopId)}&table=Hall%20A1`
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-base font-bold">{data.shop.name}</h2>
        <p className="font-mono text-xs text-slate-500">{shopId}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat label="Orders" value={data.shop.orderCount} />
        <MiniStat label="Revenue" value={formatMoney(data.shop.revenueCent)} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold">Managers</h3>
        <div className="space-y-2">
          {data.managers.map((m) => <div key={m.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{m.name}<div className="text-xs text-slate-500">{m.phone} · {m.status}</div></div>)}
          {data.managers.length === 0 ? <div className="text-sm text-slate-500">No manager accounts.</div> : null}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold">Telebirr config stub</h3>
        <div className="grid gap-2">
          <input value={payment.provider} onChange={(e) => setPayment({ ...payment, provider: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Provider" />
          <input value={payment.merchantId} onChange={(e) => setPayment({ ...payment, merchantId: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Merchant ID" />
          <input value={payment.appId} onChange={(e) => setPayment({ ...payment, appId: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="App ID" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={payment.enabled} onChange={(e) => setPayment({ ...payment, enabled: e.target.checked })} /> Enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={payment.testMode} onChange={(e) => setPayment({ ...payment, testMode: e.target.checked })} /> Test mode</label>
          <button onClick={() => void save()} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Save payment config</button>
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        Customer QR URL sample: <span className="break-all font-mono">{qrUrl}</span>
      </div>
    </section>
  )
}

function MarketingPage() {
  const query = useQuery<{ platformCoupons: Coupon[]; banners: Banner[] }>(MARKETING)
  const [createCoupon] = useMutation(CREATE_COUPON)
  const [createBanner] = useMutation(CREATE_BANNER)
  const [disableBanner] = useMutation(DISABLE_BANNER)
  async function quickCoupon() {
    const code = window.prompt('Coupon code:')
    if (!code) return
    await createCoupon({ variables: { input: { code, discountValue: 5000, validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 7 * 86400000).toISOString(), usageLimit: 100, status: 'ACTIVE', ruleType: 'NEW_USER', targetShopIds: [], targetProductIds: [] } } })
    await query.refetch()
  }
  async function quickBanner() {
    const title = window.prompt('Banner title:')
    if (!title) return
    await createBanner({ variables: { input: { title, imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80', status: 'ACTIVE' } } })
    await query.refetch()
  }
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DataList title="Platform coupons" actionLabel="New coupon" onAction={() => void quickCoupon()} rows={(query.data?.platformCoupons ?? []).map((c) => [c.code, `${formatMoney(c.discountValue)} · ${c.status}`, c.ruleType])} />
      <DataList title="Banners" actionLabel="New banner" onAction={() => void quickBanner()} rows={(query.data?.banners ?? []).map((b) => [b.title, b.status, b.linkUrl ?? 'No link'])} rowAction={(index) => {
        const banner = query.data?.banners[index]
        if (banner) void disableBanner({ variables: { bannerId: banner.id } }).then(() => query.refetch())
      }} />
    </div>
  )
}

function OperationsPage() {
  const [shopId, setShopId] = useState('')
  const [result, setResult] = useState('')
  const [run, state] = useMutation<{
    runPrintRetryCycle?: {
      processed: number
      succeeded: number
      failed: number
      alerted: number
    }
  }>(RUN_PRINT_RETRY)
  async function execute() {
    const res = await run({ variables: { shopId: shopId.trim() || null } })
    setResult(JSON.stringify(res.data?.runPrintRetryCycle ?? {}, null, 2))
  }
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold">Print retry tool</h2>
      <p className="mt-1 text-sm text-slate-500">Run the platform print retry cycle globally or for one shop.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="Optional shop id" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={() => void execute()} disabled={state.loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {state.loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Run retry
        </button>
      </div>
      {result ? <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{result}</pre> : null}
    </section>
  )
}

function AuditPage() {
  const [action, setAction] = useState('')
  const query = useQuery<{ platformAuditLogs: AuditLog[] }>(AUDIT_LOGS, { variables: { filter: { action: action || null, limit: 100 } } })
  const rows = query.data?.platformAuditLogs ?? []
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <TableHeader title="Audit logs" action={<SearchBox value={action} onChange={setAction} placeholder="Filter action" />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Time</th><th>Action</th><th>Actor</th><th>Target</th><th>Metadata</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => <tr key={row.id}><td className="px-4 py-3 text-xs">{formatDate(row.createdAt)}</td><td className="font-semibold">{row.action}</td><td className="font-mono text-xs">{row.actorId ?? '-'}</td><td className="font-mono text-xs">{row.targetType ?? '-'}:{row.targetId ?? '-'}</td><td className="max-w-md truncate text-xs text-slate-500">{row.metadata ?? '-'}</td></tr>)}
            {rows.length === 0 ? <EmptyRow colSpan={5} label="No audit logs." /> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><Icon size={20} className="text-blue-600" /></div><div className="mt-3 text-2xl font-bold">{value}</div></section>
}
function HealthRow({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' | 'blue' }) {
  const color = tone === 'green' ? 'text-green-700 bg-green-50' : tone === 'red' ? 'text-red-700 bg-red-50' : 'text-blue-700 bg-blue-50'
  return <div className={`rounded-lg px-4 py-3 ${color}`}><div className="text-sm font-semibold">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>
}
function StatusFilter({ value, onChange }: { value: Status | ''; onChange: (value: Status | '') => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as Status | '')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select>
}
function SearchBox({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div>
}
function TableHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><h2 className="text-base font-bold">{title}</h2>{action}</div>
}
function DataList({ title, actionLabel, onAction, rows, rowAction }: { title: string; actionLabel: string; onAction: () => void; rows: string[][]; rowAction?: (index: number) => void }) {
  return <section className="rounded-xl border border-slate-200 bg-white"><TableHeader title={title} action={<button onClick={onAction} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{actionLabel}</button>} /><div className="divide-y divide-slate-100">{rows.map((row, index) => <div key={`${row[0]}-${index}`} className="flex items-center justify-between gap-3 p-4 text-sm"><div><div className="font-semibold">{row[0]}</div><div className="text-xs text-slate-500">{row[1]}</div></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{row[2]}</span>{rowAction ? <button onClick={() => rowAction(index)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">Disable</button> : null}</div></div>)}{rows.length === 0 ? <div className="p-5 text-sm text-slate-500">No records.</div> : null}</div></section>
}
function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-slate-200 px-3 py-2"><div className="text-xs text-slate-500">{label}</div><div className="font-bold">{value}</div></div>
}
function StatusPill({ status }: { status: Status }) {
  const Icon = status === 'APPROVED' ? CheckCircle2 : status === 'REJECTED' ? XCircle : AlertTriangle
  const cls = status === 'APPROVED' ? 'bg-green-50 text-green-700' : status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${cls}`}><Icon size={13} />{status}</span>
}
function ShopPill({ status }: { status: ShopStatus }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${status === 'ONLINE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}><Power size={13} />{status}</span>
}
function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-500">{label}</td></tr>
}
function PanelLoader() {
  return <section className="grid min-h-48 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"><Loader2 className="animate-spin" /></section>
}
function FullScreenLoader({ label }: { label: string }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-500"><div className="flex items-center gap-3"><Loader2 className="animate-spin" />{label}</div></main>
}
function titleFor(page: Page) {
  return page === 'dashboard' ? 'Dashboard' : page === 'applications' ? 'Applications' : page === 'restaurants' ? 'Restaurants' : page === 'marketing' ? 'Marketing' : page === 'operations' ? 'Operations' : 'Audit logs'
}
function formatMoney(cents: number) {
  return `${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`
}
function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
