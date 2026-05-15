import { LogOut } from 'lucide-react'
import type { NavItem, Page, PlatformMe } from '../platform-console.types'
import { titleFor } from '../platform-console.utils'
import { MobilePageSelect } from './MobilePageSelect'

type TopbarProps = {
  nav: NavItem[]
  onLogout: () => void
  onSelectPage: (page: Page) => void
  page: Page
  session: PlatformMe
}

export function Topbar({ nav, onLogout, onSelectPage, page, session }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-950">{titleFor(page)}</h1>
          <p className="text-sm text-slate-500">{session.name} Â· {session.platformRole}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <MobilePageSelect nav={nav} page={page} onSelect={onSelectPage} />
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
