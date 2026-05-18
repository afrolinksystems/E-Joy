import { gql } from '@apollo/client'

export const CUSTOMER_SHOP = gql`
  query CustomerShop($shopId: String!) {
    customerShop(shopId: $shopId) {
      id
      name
      description
      contactPhone
      logoUrl
      customerThemePreset
      customerThemeOverrides {
        primary
        primaryForeground
        secondary
        secondaryForeground
        accent
        accentForeground
        background
        foreground
        card
        cardForeground
        muted
        mutedForeground
        border
        ring
      }
      active
    }
  }
`

export type CustomerShopThemeOverrides = {
  primary?: string | null
  primaryForeground?: string | null
  secondary?: string | null
  secondaryForeground?: string | null
  accent?: string | null
  accentForeground?: string | null
  background?: string | null
  foreground?: string | null
  card?: string | null
  cardForeground?: string | null
  muted?: string | null
  mutedForeground?: string | null
  border?: string | null
  ring?: string | null
}

export type CustomerShopRow = {
  id: string
  name: string
  description?: string | null
  contactPhone?: string | null
  logoUrl?: string | null
  customerThemePreset?: string | null
  customerThemeOverrides?: CustomerShopThemeOverrides | null
  active: boolean
}
