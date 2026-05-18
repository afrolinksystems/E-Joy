import { DataList } from '../../platform-console/components/DataList'
import { formatMoney } from '../../platform-console/platform-console.utils'
import type { Coupon } from '../marketing.types'

type CouponListProps = {
  coupons: Coupon[]
  onCreate: () => void
}

export function CouponList({ coupons, onCreate }: CouponListProps) {
  const rows = coupons.map((coupon) => [
    coupon.code,
    `${formatMoney(coupon.discountValue)} - ${coupon.status}`,
    coupon.ruleType,
  ])

  return (
    <DataList
      title="Platform coupons"
      actionLabel="New coupon"
      onAction={onCreate}
      rows={rows}
    />
  )
}
