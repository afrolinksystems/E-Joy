import { Button } from '../../../components/ui/button'
import type { NavItem, Page } from '../platform-console.types'

type DesktopNavProps = {
  activePage: Page
  nav: NavItem[]
  onSelect: (page: Page) => void
}

export function DesktopNav({ activePage, nav, onSelect }: DesktopNavProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r bg-foreground text-background lg:block">
      <div className="border-b border-background/10 p-5">
        <div className="text-lg font-bold">E-Joy Platform</div>
        <div className="mt-1 text-xs text-background/60">Super admin console</div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {nav.map(([key, Icon, label]) => (
          <Button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            variant={activePage === key ? 'secondary' : 'ghost'}
            className="h-10 justify-start text-background hover:bg-background/10 hover:text-background data-[active=true]:bg-background data-[active=true]:text-foreground"
            data-active={activePage === key}
          >
            <Icon data-icon="inline-start" />
            {label}
          </Button>
        ))}
      </nav>
    </aside>
  )
}
