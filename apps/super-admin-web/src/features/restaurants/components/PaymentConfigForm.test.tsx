import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaymentConfigForm } from './PaymentConfigForm'

describe('PaymentConfigForm', () => {
  it('saves the edited payment config payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <PaymentConfigForm
        initialValue={{ provider: 'TELEBIRR', merchantId: '', appId: '', enabled: false, testMode: true }}
        onSave={onSave}
      />,
    )

    await user.type(screen.getByPlaceholderText('Merchant ID'), 'merchant-1')
    await user.type(screen.getByPlaceholderText('App ID'), 'app-1')
    await user.click(screen.getByLabelText('Enabled'))
    await user.click(screen.getByRole('button', { name: 'Save payment config' }))

    expect(onSave).toHaveBeenCalledWith({
      provider: 'TELEBIRR',
      merchantId: 'merchant-1',
      appId: 'app-1',
      enabled: true,
      testMode: true,
    })
  })
})
