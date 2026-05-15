import { ClipboardList, LayoutDashboard, LayoutGrid, Package, Settings2, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { AdminNavItem } from '../admin-shell.types'

const NAV_ITEMS: AdminNavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/tables', label: 'Floor map', icon: LayoutGrid },
  { to: '/staff', label: 'Staff & RBAC', icon: Users },
  { to: '/settings/shop', label: 'Shop settings', icon: Settings2 },
]

type AdminSidebarProps = {
  shopName: string
}

export function AdminSidebar({ shopName }: AdminSidebarProps) {
  return (
    <aside className="admin-no-print flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-5">
        <div className="text-lg font-bold tracking-tight text-white">E-Joy</div>
        <div className="text-xs text-slate-400">{shopName}</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
  )
}
