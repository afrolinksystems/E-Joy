import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuditLogTable } from './AuditLogTable'

describe('AuditLogTable', () => {
  it('renders rows and the empty state', () => {
    const { rerender } = render(<AuditLogTable rows={[]} />)

    expect(screen.getByText('No audit logs.')).toBeInTheDocument()
    rerender(<AuditLogTable rows={[{
      id: 'log-1',
      action: 'SHOP_UPDATED',
      actorId: 'admin-1',
      createdAt: '2026-05-15T08:00:00.000Z',
      metadata: null,
      targetId: 'shop-1',
      targetType: 'SHOP',
    }]} />)

    expect(screen.getByText('SHOP_UPDATED')).toBeInTheDocument()
    expect(screen.getByText('SHOP:shop-1')).toBeInTheDocument()
  })
})
