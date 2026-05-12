import { BannerCarousel, type BannerItem } from '../components/BannerCarousel'

/** 首页顶部营销 Banner（原 Mock 数据外置，便于回归对比） */
export const homeBanners: BannerItem[] = [
  {
    id: 'home-1',
    title: '🔥 20% OFF on Special Tibs',
    bgColor: 'from-amber-600 via-orange-600 to-red-700',
  },
  {
    id: 'home-2',
    title: 'Welcome to E-Joy Addis Ababa',
    bgColor: 'from-slate-800 via-slate-700 to-orange-900',
  },
  {
    id: 'home-3',
    title: 'New Arrival: Fresh Mango Juice',
    bgColor: 'from-emerald-700 via-teal-700 to-cyan-900',
  },
]

/**
 * 顾客端首页顶部区域：走马灯置于搜索框与门店列表之上。
 * 完整首页仍由 App 编排；此处仅承载首页顶部 Banner 区块。
 */
export function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1352px] px-4 pb-4 sm:px-6">
      <BannerCarousel banners={homeBanners} />
    </div>
  )
}
