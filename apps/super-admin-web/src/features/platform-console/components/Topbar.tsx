import { LogOut } from 'lucide-react'
import { Button } from '../../../components/ui/button'
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
    <header className="sticky top-0 z-10 border-b bg-card/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">{titleFor(page)}</h1>
          <p className="text-sm text-muted-foreground">{session.name} - {session.platformRole}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <MobilePageSelect nav={nav} page={page} onSelect={onSelectPage} />
          </div>
          <Button type="button" onClick={onLogout} variant="outline">
            <LogOut data-icon="inline-start" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
