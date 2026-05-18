import { BannerList } from './components/BannerList'
import { CouponList } from './components/CouponList'
import { useMarketingPage } from './hooks/useMarketingPage'

export function MarketingPage() {
  const page = useMarketingPage()

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <CouponList coupons={page.coupons} onCreate={() => void page.quickCoupon()} />
      <BannerList
        banners={page.banners}
        onCreate={() => void page.quickBanner()}
        onDisable={(index) => void page.disableBannerAt(index)}
      />
    </div>
  )
}
