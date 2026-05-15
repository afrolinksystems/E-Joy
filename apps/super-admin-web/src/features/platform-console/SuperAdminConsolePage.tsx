import {
  Building2,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  Megaphone,
  RefreshCw,
} from 'lucide-react'
import { LoginScreen } from '../auth/components/LoginScreen'
import { ConsoleContent } from './components/ConsoleContent'
import { FullScreenLoader } from './components/FullScreenLoader'
import { useSuperAdminSession } from './hooks/useSuperAdminSession'
import type { NavItem } from './platform-console.types'
import { clearSuperAdminAccessToken } from '../../lib/apollo'

const NAV_ITEMS: NavItem[] = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['applications', ClipboardList, 'Applications'],
  ['restaurants', Building2, 'Restaurants'],
  ['marketing', Megaphone, 'Marketing'],
  ['operations', RefreshCw, 'Operations'],
  ['audit', FileClock, 'Audit'],
]

export function SuperAdminConsolePage() {
  const session = useSuperAdminSession()

  if (!session.bootstrapped) {
    return <FullScreenLoader label="Restoring secure session" />
  }
  if (!session.hasToken || session.me.error) {
    if (session.me.error) clearSuperAdminAccessToken()
    return <LoginScreen error={session.me.error?.message} onLoggedIn={session.markLoggedIn} />
  }
  if (session.me.loading && !session.me.data) {
    return <FullScreenLoader label="Loading super admin console" />
  }

  return <ConsoleContent nav={NAV_ITEMS} session={session.me.data!.platformMe} onLogout={session.markLoggedOut} />
}
