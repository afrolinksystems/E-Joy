import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CartItem } from '../../../store/useCartStore'
import type { MenuItem } from '../customer-ordering.types'
import { CheckoutCartDrawer } from './CheckoutCartDrawer'
import { MissingQrScreen } from './MissingQrScreen'
import { ProductCard } from './ProductCard'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('../../../lib/mockTelebirrRedirectUrl', () => ({
  getOrderServiceHttpOrigin: () => 'http://localhost:9602',
}))

const baseCartProps = {
  checkoutLoading: false,
  deleteItem: vi.fn(),
  incrementItem: vi.fn(),
  lastOrder: null,
  note: '',
  onClear: vi.fn(),
  onOpenChange: vi.fn(),
  removeItem: vi.fn(),
  setNote: vi.fn(),
}

describe('customer ordering components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the missing QR session state', () => {
    render(<MissingQrScreen />)

    expect(screen.getByText('Scan your table QR code')).toBeInTheDocument()
    expect(screen.getByText('?shopId=test-shop-001&table=test-table-001')).toBeInTheDocument()
  })

  it('keeps product card open and add actions separate', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onOpen = vi.fn()
    const item: MenuItem = {
      id: 'p1',
      name: 'Chicken tibs',
      category: 'Main',
      unitPrice: 1250,
      imageUrl: 'https://cdn.example.com/tibs.jpg',
    }

    render(<ProductCard item={item} onAdd={onAdd} onOpen={onOpen} />)

    await user.click(screen.getByRole('button', { name: 'View Chicken tibs' }))
    await user.click(screen.getByRole('button', { name: 'Add Chicken tibs' }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(screen.getByText('12.50 ETB')).toBeInTheDocument()
  })

  it('disables checkout when the cart is empty', () => {
    render(
      <CheckoutCartDrawer
        {...baseCartProps}
        cart={[]}
        onPay={vi.fn()}
        open
        totalPrice={0}
        totalQuantity={0}
      />,
    )

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pay with Telebirr' })).toBeDisabled()
  })

  it('shows checkout errors without clearing the cart', async () => {
    const cart: CartItem[] = [{ id: 'p1', name: 'Chicken tibs', price: 1250, quantity: 1 }]
    const onPay = vi.fn().mockRejectedValue(new Error('Order service unavailable'))

    render(
      <CheckoutCartDrawer
        {...baseCartProps}
        cart={cart}
        onPay={onPay}
        open
        totalPrice={1250}
        totalQuantity={1}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pay with Telebirr' }))

    await waitFor(() => {
      expect(screen.getByText('Checkout failed')).toBeInTheDocument()
      expect(screen.getByText('Order service unavailable')).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Chicken tibs' })).toBeInTheDocument()
  })
})
