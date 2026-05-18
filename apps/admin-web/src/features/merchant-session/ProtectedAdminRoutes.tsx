import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginScreen } from '../auth/components/LoginScreen'
import { AdminLayout } from '../admin-shell/components/AdminLayout'
import { DashboardPage } from '../dashboard/DashboardPage'
import { OrdersPage } from '../orders/OrdersPage'
import { ProductManager } from '../products/ProductManager'
import { ShopSettings } from '../shop-settings/ShopSettings'
import { StaffManagementPage } from '../staff/StaffManagementPage'
import { TableView } from '../tables/TableView'
import { clearAdminAccessToken } from '../../lib/apollo'
import { FullScreenLoader } from './components/FullScreenLoader'
import { useMerchantSession } from './hooks/useMerchantSession'
import { MerchantSessionProvider } from './MerchantSessionProvider'

export function ProtectedAdminRoutes() {
  const session = useMerchantSession()

  if (!session.bootstrapped) {
    return <FullScreenLoader label="Restoring secure session..." />
  }
  if (!session.hasToken) {
    return <LoginScreen onLoggedIn={session.markLoggedIn} />
  }
  if (session.me.loading && !session.me.data) {
    return <FullScreenLoader label="Loading merchant console..." />
  }
  if (session.me.error || !session.me.data?.merchantMe) {
    clearAdminAccessToken()
    return (
      <LoginScreen
        error={session.me.error?.message ?? 'Session expired. Please sign in again.'}
        onLoggedIn={session.markLoggedIn}
      />
    )
  }

  return (
    <MerchantSessionProvider session={session.me.data.merchantMe} logout={session.logout}>
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
    </MerchantSessionProvider>
  )
}
