import { BannerCarousel } from '../components/BannerCarousel'
import { shopPromoBanners } from '../data/shopPromoBanners'

export { CartDrawer, type CartDrawerProps } from '../components/CartDrawer'

export interface ShopMenuHeroProps {
  onBack: () => void
  onShare?: () => void
  shopName?: string
  cuisineLabel?: string
  ratingLabel?: string
  isOpen?: boolean
}

/**
 * Immersive shop hero: full-bleed carousel, gradient overlay, floating actions.
 */
export function ShopMenuHero({
  onBack,
  onShare,
  shopName = 'Habesha Kitchen',
  cuisineLabel = 'Ethiopian',
  ratingLabel = '⭐ 4.5',
  isOpen = true,
}: ShopMenuHeroProps) {
  return (
    <div className="relative h-56 w-full sm:h-64">
      <BannerCarousel
        banners={shopPromoBanners}
        compact
        hideSlideContent
        className="absolute inset-0 m-0 flex h-full w-full min-h-0 flex-col"
        viewportClassName="h-full rounded-none shadow-none"
        slideClassName="!aspect-auto h-full min-h-0"
        overlayClassName="bg-gradient-to-t from-black/80 via-black/20 to-transparent"
      />

      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-lg text-[#1a2c3e] shadow-sm backdrop-blur-sm transition hover:bg-white"
        aria-label="Back"
      >
        ←
      </button>
      <button
        type="button"
        onClick={onShare}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-lg text-[#1a2c3e] shadow-sm backdrop-blur-sm transition hover:bg-white"
        aria-label="Share"
      >
        ⤴
      </button>

      <div className="absolute bottom-4 left-4 z-20 max-w-[min(100%-2rem,28rem)] text-white">
        <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {shopName}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-white/95 sm:text-sm">
          <span>{ratingLabel}</span>
          <span className="mx-2 text-white/70">•</span>
          <span>{cuisineLabel}</span>
          <span className="mx-2 text-white/70">•</span>
          <span className={isOpen ? 'font-medium text-emerald-300' : 'text-red-300'}>
            {isOpen ? 'Open now' : 'Closed'}
          </span>
        </p>
      </div>
    </div>
  )
}
