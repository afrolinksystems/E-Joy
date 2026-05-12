type CartCheckoutBarProps = {
  itemCount: number
  subtotalCents: number
  onGoCheckout: () => void
  /** True when empty or navigation disabled */
  disabled?: boolean
}

/**
 * Floating checkout bar; navigates to checkout (createOrder on confirm step).
 */
export function CartCheckoutBar({
  itemCount,
  subtotalCents,
  onGoCheckout,
  disabled = false,
}: CartCheckoutBarProps) {
  return (
    <button
      type="button"
      disabled={disabled || itemCount === 0}
      onClick={() => {
        if (disabled || itemCount === 0) return
        onGoCheckout()
      }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 96,
        height: 48,
        borderRadius: 999,
        border: 'none',
        background: disabled || itemCount === 0 ? '#d1d5db' : '#e67e22',
        color: '#fff',
        padding: '0 16px',
        fontWeight: 700,
        boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
        cursor: disabled || itemCount === 0 ? 'not-allowed' : 'pointer',
      }}
    >
      Cart · {itemCount} items · {(subtotalCents / 100).toFixed(0)} Birr
    </button>
  )
}
