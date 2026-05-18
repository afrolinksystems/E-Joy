import { Outlet } from 'react-router-dom'
import { useAdminSession } from '../../../lib/adminSession'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

export function AdminLayout() {
  const { session, logout } = useAdminSession()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar shopName={session.shop.name} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar session={session} onLogout={logout} />
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
