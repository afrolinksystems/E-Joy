import {
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Settings2,
  Users,
  LogOut,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAdminSession } from '../lib/adminSession'

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/tables', label: 'Floor map', icon: LayoutGrid },
  { to: '/staff', label: 'Staff & RBAC', icon: Users },
  { to: '/settings/shop', label: 'Shop settings', icon: Settings2 },
]

export function AdminLayout() {
  const { session, logout } = useAdminSession()
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="admin-no-print flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="text-lg font-bold tracking-tight text-white">E-Joy</div>
          <div className="text-xs text-slate-400">{session.shop.name}</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-no-print flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Console</h1>
            <p className="text-xs text-slate-500">
              {session.name} · {session.role} · {session.shopId}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
