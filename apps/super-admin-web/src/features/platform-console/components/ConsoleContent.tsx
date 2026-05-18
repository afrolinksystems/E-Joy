import { useState } from 'react'
import { ApplicationsPage } from '../../applications/ApplicationsPage'
import { AuditPage } from '../../audit/AuditPage'
import { DashboardPage } from '../../dashboard/DashboardPage'
import { MarketingPage } from '../../marketing/MarketingPage'
import { OperationsPage } from '../../operations/OperationsPage'
import { RestaurantsPage } from '../../restaurants/RestaurantsPage'
import { useSuperAdminLogout } from '../hooks/useSuperAdminLogout'
import type { NavItem, Page, PlatformMe } from '../platform-console.types'
import { ConsoleLayout } from './ConsoleLayout'

type ConsoleContentProps = {
  nav: NavItem[]
  onLogout: () => void
  session: PlatformMe
}

export function ConsoleContent({ nav, onLogout, session }: ConsoleContentProps) {
  const [page, setPage] = useState<Page>('dashboard')
  const logout = useSuperAdminLogout(onLogout)

  return (
    <ConsoleLayout nav={nav} page={page} onSelectPage={setPage} session={session} onLogout={() => void logout()}>
      {page === 'dashboard' ? <DashboardPage /> : null}
      {page === 'applications' ? <ApplicationsPage /> : null}
      {page === 'restaurants' ? <RestaurantsPage /> : null}
      {page === 'marketing' ? <MarketingPage /> : null}
      {page === 'operations' ? <OperationsPage /> : null}
      {page === 'audit' ? <AuditPage /> : null}
    </ConsoleLayout>
  )
}
