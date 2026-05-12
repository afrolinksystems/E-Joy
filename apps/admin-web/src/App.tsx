import { ApolloProvider } from '@apollo/client/react'
import { useMutation, useQuery } from '@apollo/client/react'
import { Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MERCHANT_ME, STAFF_LOGIN, type MerchantMeData, type StaffLoginData } from './graphql/auth'
import { apolloClient } from './lib/apollo'
import { AdminSessionContext, ADMIN_TOKEN_STORAGE_KEY } from './lib/adminSession'
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
  const [tokenVersion, setTokenVersion] = useState(0)
  const hasToken = Boolean(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY))
  const { data, loading, error, refetch } = useQuery<MerchantMeData>(MERCHANT_ME, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  })

  const logout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    void apolloClient.clearStore()
    setTokenVersion((v) => v + 1)
  }

  if (!hasToken) {
    return (
      <LoginScreen
        key={`login-${tokenVersion}`}
        onLoggedIn={() => {
          setTokenVersion((v) => v + 1)
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
    return (
      <LoginScreen
        error={error?.message ?? 'Session expired. Please sign in again.'}
        onLoggedIn={() => {
          setTokenVersion((v) => v + 1)
          void refetch()
        }}
      />
    )
  }

  return (
    <AdminSessionContext.Provider
      value={{ session: data.merchantMe, shopId: data.merchantMe.shopId, logout }}
    >
      <BrowserRouter>
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
      </BrowserRouter>
    </AdminSessionContext.Provider>
  )
}

function LoginScreen({
  error,
  onLoggedIn,
}: {
  error?: string
  onLoggedIn: () => void
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
      if (!token) throw new Error('Login failed')
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
      await apolloClient.resetStore()
      onLoggedIn()
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
