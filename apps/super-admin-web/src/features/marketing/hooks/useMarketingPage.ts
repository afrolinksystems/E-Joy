import { useMutation, useQuery } from '@apollo/client/react'
import {
  CREATE_BANNER,
  CREATE_COUPON,
  DISABLE_BANNER,
  MARKETING,
} from '../../../graphql/marketing'
import type { Banner, Coupon } from '../marketing.types'

const BANNER_IMAGE_URL =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'

export function useMarketingPage() {
  const query = useQuery<{ platformCoupons: Coupon[]; banners: Banner[] }>(MARKETING)
  const [createCoupon] = useMutation(CREATE_COUPON)
  const [createBanner] = useMutation(CREATE_BANNER)
  const [disableBanner] = useMutation(DISABLE_BANNER)
  const coupons = query.data?.platformCoupons ?? []
  const banners = query.data?.banners ?? []

  async function quickCoupon() {
    const code = window.prompt('Coupon code:')
    if (!code) return
    await createCoupon({
      variables: {
        input: {
          code,
          discountValue: 5000,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
          usageLimit: 100,
          status: 'ACTIVE',
          ruleType: 'NEW_USER',
          targetShopIds: [],
          targetProductIds: [],
        },
      },
    })
    await query.refetch()
  }

  async function quickBanner() {
    const title = window.prompt('Banner title:')
    if (!title) return
    await createBanner({ variables: { input: { title, imageUrl: BANNER_IMAGE_URL, status: 'ACTIVE' } } })
    await query.refetch()
  }

  async function disableBannerAt(index: number) {
    const banner = banners[index]
    if (!banner) return
    await disableBanner({ variables: { bannerId: banner.id } })
    await query.refetch()
  }

  return {
    banners,
    coupons,
    disableBannerAt,
    quickBanner,
    quickCoupon,
  }
}
