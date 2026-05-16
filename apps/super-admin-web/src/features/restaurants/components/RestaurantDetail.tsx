import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
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
  if (!detail.data) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Restaurant not found.</EmptyTitle>
            <EmptyDescription>Select another restaurant to inspect its console details.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{detail.data.shop.name}</CardTitle>
        <CardDescription className="font-mono">{shopId}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Orders" value={detail.data.shop.orderCount} />
          <MiniStat label="Revenue" value={formatMoney(detail.data.shop.revenueCent)} />
        </div>
        <ManagersList managers={detail.data.managers} />
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">Telebirr config stub</h3>
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
        </section>
        <CustomerQrSample shopId={shopId} />
      </CardContent>
    </Card>
  )
}
