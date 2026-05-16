import type { ReactNode } from 'react'
import type { NavItem, Page, PlatformMe } from '../platform-console.types'
import { DesktopNav } from './DesktopNav'
import { Topbar } from './Topbar'

type ConsoleLayoutProps = {
  children: ReactNode
  nav: NavItem[]
  onLogout: () => void
  onSelectPage: (page: Page) => void
  page: Page
  session: PlatformMe
}

export function ConsoleLayout({ children, nav, onLogout, onSelectPage, page, session }: ConsoleLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <DesktopNav activePage={page} nav={nav} onSelect={onSelectPage} />
        <section className="min-w-0 flex-1">
          <Topbar nav={nav} onLogout={onLogout} onSelectPage={onSelectPage} page={page} session={session} />
          <div className="p-4 md:p-6">{children}</div>
        </section>
      </div>
    </main>
  )
}
