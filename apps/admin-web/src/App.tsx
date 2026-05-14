import { ApolloProvider } from '@apollo/client/react'
import { useMutation, useQuery } from '@apollo/client/react'
import { ArrowRight, CheckCircle2, ClipboardList, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import {
  MERCHANT_ME,
  LOGOUT,
  REFRESH_SESSION,
  STAFF_LOGIN,
  SUBMIT_SHOP_APPLICATION,
  type MerchantMeData,
  type RefreshSessionData,
  type StaffLoginData,
  type SubmitShopApplicationData,
} from './graphql/auth'
import {
  apolloClient,
  clearAdminAccessToken,
  setAdminAccessToken,
} from './lib/apollo'
import { AdminSessionContext } from './lib/adminSession'
import { AdminLayout } from './layouts/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { TableView } from './pages/TableView'
import { ProductManager } from './pages/products/ProductManager'
import { ShopSettings } from './pages/settings/ShopSettings'
import { StaffManagementPage } from './pages/StaffManagementPage'

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AdminAppRoutes />
    </ApolloProvider>
  )
}

function AdminAppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/apply" element={<RestaurantApplicationPage />} />
        <Route path="/*" element={<ProtectedAdminRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedAdminRoutes() {
  const [hasToken, setHasToken] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null)
  const [refreshSession] = useMutation<RefreshSessionData>(REFRESH_SESSION)
  const [logoutMutation] = useMutation(LOGOUT)
  const { data, loading, error, refetch } = useQuery<MerchantMeData>(MERCHANT_ME, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    let alive = true
    async function restoreSession() {
      try {
        const result = await refreshSession()
        const token = result.data?.refreshSession?.accessToken
        if (token) {
          setAdminAccessToken(token)
          if (alive) setAccessExpiresAt(result.data?.refreshSession?.expiresAt ?? null)
          if (alive) setHasToken(true)
        }
      } catch {
        clearAdminAccessToken()
        if (alive) setHasToken(false)
      } finally {
        if (alive) setBootstrapped(true)
      }
    }
    void restoreSession()
    return () => {
      alive = false
    }
  }, [refreshSession])

  useEffect(() => {
    function handleAuthExpired() {
      clearAdminAccessToken()
      void apolloClient.clearStore()
      setHasToken(false)
      setBootstrapped(true)
      setAccessExpiresAt(null)
    }
    window.addEventListener('ejoy-auth-expired', handleAuthExpired)
    return () => window.removeEventListener('ejoy-auth-expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    function handleAuthRefreshed(event: Event) {
      const expiresAt = (event as CustomEvent<{ expiresAt?: string }>).detail?.expiresAt
      setAccessExpiresAt(expiresAt ?? null)
      setHasToken(Boolean(expiresAt))
    }
    window.addEventListener('ejoy-auth-refreshed', handleAuthRefreshed)
    return () => window.removeEventListener('ejoy-auth-refreshed', handleAuthRefreshed)
  }, [])

  useEffect(() => {
    if (!hasToken || !accessExpiresAt) return
    const expiresMs = new Date(accessExpiresAt).getTime()
    const refreshInMs = Math.max(0, expiresMs - Date.now() - 30_000)
    const timer = window.setTimeout(() => {
      void refreshSession()
        .then((result) => {
          const session = result.data?.refreshSession
          if (!session?.accessToken) throw new Error('Session expired')
          setAdminAccessToken(session.accessToken)
          setAccessExpiresAt(session.expiresAt)
          setHasToken(true)
        })
        .catch(() => {
          clearAdminAccessToken()
          void apolloClient.clearStore()
          setAccessExpiresAt(null)
          setHasToken(false)
        })
    }, refreshInMs)
    return () => window.clearTimeout(timer)
  }, [accessExpiresAt, hasToken, refreshSession])

  const logout = async () => {
    setHasToken(false)
    setAccessExpiresAt(null)
    clearAdminAccessToken()
    try {
      await logoutMutation()
    } catch {
      // Local logout still wins; backend logout is best-effort if the network is gone.
    }
    clearAdminAccessToken()
    await apolloClient.clearStore()
  }

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-100 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        Restoring secure session...
      </div>
    )
  }

  if (!hasToken) {
    return (
      <LoginScreen
        onLoggedIn={(expiresAt) => {
          setAccessExpiresAt(expiresAt)
          setHasToken(true)
          void refetch()
        }}
      />
    )
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-100 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        Loading merchant console...
      </div>
    )
  }

  if (error || !data?.merchantMe) {
    clearAdminAccessToken()
    return (
      <LoginScreen
        error={error?.message ?? 'Session expired. Please sign in again.'}
        onLoggedIn={(expiresAt) => {
          setAccessExpiresAt(expiresAt)
          setHasToken(true)
          void refetch()
        }}
      />
    )
  }

  return (
    <AdminSessionContext.Provider
      value={{ session: data.merchantMe, shopId: data.merchantMe.shopId, logout }}
    >
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tables" element={<TableView />} />
          <Route path="settings/shop" element={<ShopSettings />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AdminSessionContext.Provider>
  )
}

function RestaurantApplicationPage() {
  const [shopName, setShopName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [businessLicense, setBusinessLicense] = useState('')
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] =
    useState<SubmitShopApplicationData['submitShopApplication'] | null>(null)
  const [submitApplication, { loading }] =
    useMutation<SubmitShopApplicationData>(SUBMIT_SHOP_APPLICATION)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const input = {
      shopName: shopName.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      businessLicense: businessLicense.trim(),
    }
    if (
      !input.shopName ||
      !input.contactName ||
      !input.contactPhone ||
      !input.businessLicense
    ) {
      setFormError('Please fill in every field.')
      return
    }
    try {
      const result = await submitApplication({ variables: { input } })
      const application = result.data?.submitShopApplication
      if (!application) throw new Error('Application was not submitted.')
      setSubmitted(application)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Application failed.')
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-lg place-items-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Application submitted</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We received the application for {submitted.shopName}. A platform
              admin will review it and contact {submitted.contactName}.
            </p>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="font-semibold">Reference</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{submitted.id}</div>
              <div className="mt-3 font-semibold">Status</div>
              <div className="mt-1 text-slate-600">{submitted.status}</div>
            </div>
            <Link
              to="/"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Go to merchant login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-700">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-normal">
            Register your restaurant
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Submit your restaurant details for E-Joy review. After approval,
            your manager account and temporary password will be issued by the
            platform team.
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <span>Applications are reviewed before any merchant access is created.</span>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <span>Approved restaurants receive a dedicated manager login.</span>
            </div>
          </div>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Already approved? Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <form
          onSubmit={(e) => void submit(e)}
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Restaurant name</span>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                autoComplete="organization"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Contact person</span>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Business license or registration number
              </span>
              <input
                value={businessLicense}
                onChange={(e) => setBusinessLicense(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
              />
            </label>
          </div>
          {formError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit application
          </button>
        </form>
      </section>
    </main>
  )
}

function LoginScreen({
  error,
  onLoggedIn,
}: {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(error ?? null)
  const [login, { loading }] = useMutation<StaffLoginData>(STAFF_LOGIN)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    try {
      const result = await login({ variables: { phone: phone.trim(), password } })
      const token = result.data?.staffLogin.accessToken
      const expiresAt = result.data?.staffLogin.expiresAt
      if (!token) throw new Error('Login failed')
      setAdminAccessToken(token)
      await apolloClient.resetStore()
      onLoggedIn(expiresAt ?? new Date(Date.now() + 15 * 60_000).toISOString())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">Merchant login</h1>
            <p className="text-sm text-slate-500">Sign in to your restaurant console.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
            />
          </label>
        </div>
        {formError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading || !phone.trim() || !password.trim()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>
    </main>
  )
}
