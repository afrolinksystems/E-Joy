import { MiniStat } from '../../platform-console/components/MiniStat'
import { PanelLoader } from '../../platform-console/components/PanelLoader'
import { formatMoney } from '../../platform-console/platform-console.utils'
import { CustomerQrSample } from './CustomerQrSample'
import { ManagersList } from './ManagersList'
import { PaymentConfigForm } from './PaymentConfigForm'
import { useRestaurantDetail } from '../hooks/useRestaurantDetail'

type RestaurantDetailProps = {
  shopId: string
}

export function RestaurantDetail({ shopId }: RestaurantDetailProps) {
  const detail = useRestaurantDetail(shopId)

  if (detail.loading && !detail.data) return <PanelLoader />
  if (!detail.data) return <section className="rounded-xl border border-slate-200 bg-white p-5">Restaurant not found.</section>

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-base font-bold">{detail.data.shop.name}</h2>
        <p className="font-mono text-xs text-slate-500">{shopId}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat label="Orders" value={detail.data.shop.orderCount} />
        <MiniStat label="Revenue" value={formatMoney(detail.data.shop.revenueCent)} />
      </div>
      <ManagersList managers={detail.data.managers} />
      <div>
        <h3 className="mb-2 text-sm font-bold">Telebirr config stub</h3>
        <PaymentConfigForm
          key={detail.data.paymentConfig?.id ?? shopId}
          initialValue={{
            provider: detail.data.paymentConfig?.provider ?? 'TELEBIRR',
            merchantId: detail.data.paymentConfig?.merchantId ?? '',
            appId: detail.data.paymentConfig?.appId ?? '',
            enabled: detail.data.paymentConfig?.enabled ?? false,
            testMode: detail.data.paymentConfig?.testMode ?? true,
          }}
          onSave={detail.save}
        />
      </div>
      <CustomerQrSample shopId={shopId} />
    </section>
  )
}
