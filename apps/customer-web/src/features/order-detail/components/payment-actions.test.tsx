import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaymentActions } from './PaymentActions'

describe('payment actions', () => {
  it('shows an informational state when no payment is needed', () => {
    render(<PaymentActions needsPayment={false} onPay={vi.fn()} totalAmount={1200} />)

    expect(screen.getByText('Payment status')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pay with Telebirr' })).not.toBeInTheDocument()
  })

  it('renders the Telebirr action when payment is needed', async () => {
    const user = userEvent.setup()
    const onPay = vi.fn()

    render(<PaymentActions needsPayment onPay={onPay} totalAmount={1250} />)

    expect(screen.getByText('12.50 Birr')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pay with Telebirr' }))

    expect(onPay).toHaveBeenCalledTimes(1)
  })
})
