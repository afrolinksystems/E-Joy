import { usePaymentConfigForm } from '../hooks/usePaymentConfigForm'
import type { PaymentConfigFormState } from '../restaurants.types'

type PaymentConfigFormProps = {
  initialValue: PaymentConfigFormState
  onSave: (payment: PaymentConfigFormState) => Promise<void>
}

export function PaymentConfigForm({ initialValue, onSave }: PaymentConfigFormProps) {
  const form = usePaymentConfigForm(initialValue)

  return (
    <div className="grid gap-2">
      <input value={form.payment.provider} onChange={(event) => form.update('provider', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Provider" />
      <input value={form.payment.merchantId} onChange={(event) => form.update('merchantId', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Merchant ID" />
      <input value={form.payment.appId} onChange={(event) => form.update('appId', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="App ID" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.payment.enabled} onChange={(event) => form.update('enabled', event.target.checked)} /> Enabled</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.payment.testMode} onChange={(event) => form.update('testMode', event.target.checked)} /> Test mode</label>
      <button onClick={() => void onSave(form.payment)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Save payment config</button>
    </div>
  )
}
