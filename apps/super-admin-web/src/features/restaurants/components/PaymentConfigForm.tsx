import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Field, FieldContent, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { usePaymentConfigForm } from '../hooks/usePaymentConfigForm'
import type { PaymentConfigFormState } from '../restaurants.types'

type PaymentConfigFormProps = {
  initialValue: PaymentConfigFormState
  onSave: (payment: PaymentConfigFormState) => Promise<void>
}

export function PaymentConfigForm({ initialValue, onSave }: PaymentConfigFormProps) {
  const form = usePaymentConfigForm(initialValue)

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="payment-provider">Provider</FieldLabel>
        <Input
          id="payment-provider"
          value={form.payment.provider}
          onChange={(event) => form.update('provider', event.target.value)}
          placeholder="Provider"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="payment-merchant-id">Merchant ID</FieldLabel>
        <Input
          id="payment-merchant-id"
          value={form.payment.merchantId}
          onChange={(event) => form.update('merchantId', event.target.value)}
          placeholder="Merchant ID"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="payment-app-id">App ID</FieldLabel>
        <Input
          id="payment-app-id"
          value={form.payment.appId}
          onChange={(event) => form.update('appId', event.target.value)}
          placeholder="App ID"
        />
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          checked={form.payment.enabled}
          onCheckedChange={(checked) => form.update('enabled', checked === true)}
          aria-label="Enabled"
        />
        <FieldContent>
          <FieldLabel>Enabled</FieldLabel>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          checked={form.payment.testMode}
          onCheckedChange={(checked) => form.update('testMode', checked === true)}
          aria-label="Test mode"
        />
        <FieldContent>
          <FieldLabel>Test mode</FieldLabel>
        </FieldContent>
      </Field>
      <Button type="button" onClick={() => void onSave(form.payment)}>
        Save payment config
      </Button>
    </FieldGroup>
  )
}
