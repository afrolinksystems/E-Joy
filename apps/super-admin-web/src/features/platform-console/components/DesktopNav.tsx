import type { NavItem, Page } from '../platform-console.types'

type DesktopNavProps = {
  activePage: Page
  nav: NavItem[]
  onSelect: (page: Page) => void
}

export function DesktopNav({ activePage, nav, onSelect }: DesktopNavProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:block">
      <div className="border-b border-white/10 p-5">
        <div className="text-lg font-bold">E-Joy Platform</div>
        <div className="mt-1 text-xs text-slate-400">Super admin console</div>
      </div>
      <nav className="space-y-1 p-3">
        {nav.map(([key, Icon, label]) => (
          <button key={key} onClick={() => onSelect(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${activePage === key ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
