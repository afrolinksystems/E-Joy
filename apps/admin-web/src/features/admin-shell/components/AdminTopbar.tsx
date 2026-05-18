import { LogOut } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { MerchantSession } from '../../merchant-session/merchant-session.types'

type AdminTopbarProps = {
  onLogout: () => void
  session: MerchantSession
}

export function AdminTopbar({ onLogout, session }: AdminTopbarProps) {
  return (
    <header className="admin-no-print flex h-14 shrink-0 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div>
        <h1 className="text-sm font-semibold">Console</h1>
        <p className="text-xs text-muted-foreground">
          {session.name} - {session.role} - {session.shopId}
        </p>
      </div>
      <Button type="button" onClick={onLogout} variant="outline">
        <LogOut data-icon="inline-start" />
        Logout
      </Button>
    </header>
  )
}
