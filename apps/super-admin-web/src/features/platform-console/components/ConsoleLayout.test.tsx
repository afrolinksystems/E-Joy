import { LayoutDashboard, Megaphone } from 'lucide-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NavItem, PlatformMe } from '../platform-console.types'
import { ConsoleLayout } from './ConsoleLayout'

const nav: NavItem[] = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['marketing', Megaphone, 'Marketing'],
]

const session: PlatformMe = {
  id: 'admin-1',
  identifier: 'owner@ejoy.local',
  name: 'Owner',
  platformRole: 'SUPER_ADMIN',
  scope: [],
}

describe('ConsoleLayout', () => {
  it('renders the current page title and delegates logout', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()

    render(
      <ConsoleLayout nav={nav} page="dashboard" onSelectPage={vi.fn()} session={session} onLogout={onLogout}>
        <div>Dashboard body</div>
      </ConsoleLayout>,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Dashboard body')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('delegates page changes from desktop navigation', async () => {
    const user = userEvent.setup()
    const onSelectPage = vi.fn()

    render(
      <ConsoleLayout nav={nav} page="dashboard" onSelectPage={onSelectPage} session={session} onLogout={vi.fn()}>
        <div />
      </ConsoleLayout>,
    )

    await user.click(screen.getByRole('button', { name: 'Marketing' }))
    expect(onSelectPage).toHaveBeenCalledWith('marketing')
  })
})
