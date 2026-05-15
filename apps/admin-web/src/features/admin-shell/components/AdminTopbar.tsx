import { LogOut } from 'lucide-react'
import type { MerchantSession } from '../../merchant-session/merchant-session.types'

type AdminTopbarProps = {
  onLogout: () => void
  session: MerchantSession
}

export function AdminTopbar({ onLogout, session }: AdminTopbarProps) {
  return (
    <header className="admin-no-print flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div>
        <h1 className="text-sm font-semibold text-slate-800">Console</h1>
        <p className="text-xs text-slate-500">
          {session.name} Â· {session.role} Â· {session.shopId}
        </p>
      </div>
      <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </header>
  )
}
