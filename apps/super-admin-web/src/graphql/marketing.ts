import { gql } from '@apollo/client'

export const MARKETING = gql`
  query Marketing {
    platformCoupons {
      id
      code
      discountValue
      status
      ruleType
      minOrderAmount
    }
    banners {
      id
      title
      imageUrl
      linkUrl
      status
      createdAt
    }
  }
`

export const CREATE_COUPON = gql`
  mutation CreatePlatformCoupon($input: CreatePlatformCouponInput!) {
    createPlatformCoupon(input: $input) {
      id
      code
    }
  }
`

export const CREATE_BANNER = gql`
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      id
      title
    }
  }
`

export const DISABLE_BANNER = gql`
  mutation DisableBanner($bannerId: String!) {
    disableBanner(bannerId: $bannerId)
  }
`
