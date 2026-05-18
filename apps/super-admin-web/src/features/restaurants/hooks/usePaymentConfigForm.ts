import { useState } from 'react'
import type { PaymentConfigFormState } from '../restaurants.types'

export function usePaymentConfigForm(initialValue: PaymentConfigFormState) {
  const [payment, setPayment] = useState(initialValue)

  function update<Field extends keyof PaymentConfigFormState>(
    field: Field,
    value: PaymentConfigFormState[Field],
  ) {
    setPayment((current) => ({ ...current, [field]: value }))
  }

  return {
    payment,
    update,
  }
}
