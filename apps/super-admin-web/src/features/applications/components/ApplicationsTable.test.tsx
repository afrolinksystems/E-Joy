import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Application } from '../applications.types'
import { ApplicationsTable } from './ApplicationsTable'

const pending: Application = {
  id: 'app-1',
  contactName: 'Hana',
  contactPhone: '+251900000000',
  createdShopId: null,
  shopName: 'Cafe One',
  status: 'PENDING',
}

describe('ApplicationsTable', () => {
  it('enables actions only for pending applications', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const approved = { ...pending, id: 'app-2', shopName: 'Cafe Two', status: 'APPROVED' as const }

    render(
      <ApplicationsTable
        applications={[pending, approved]}
        approveLoading={false}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Approve' })[1]).toBeDisabled()
    await user.click(screen.getAllByRole('button', { name: 'Approve' })[0])
    expect(onApprove).toHaveBeenCalledWith(pending)
  })

  it('renders the empty state', () => {
    render(<ApplicationsTable applications={[]} approveLoading={false} onApprove={vi.fn()} onReject={vi.fn()} />)

    expect(screen.getByText('No applications found.')).toBeInTheDocument()
  })
})
