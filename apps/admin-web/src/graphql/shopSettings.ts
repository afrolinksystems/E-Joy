import { gql } from '@apollo/client'

export const SHOP = gql`
  query Shop($id: String!) {
    shop(id: $id) {
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

export const UPDATE_SHOP = gql`
  mutation UpdateShop($shopId: String, $input: UpdateShopInput!) {
    updateShop(shopId: $shopId, input: $input) {
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

export type ShopThemeOverrides = {
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

export type ShopConfigRow = {
  id: string
  name: string
  description?: string | null
  contactPhone?: string | null
  logoUrl?: string | null
  customerThemePreset?: string | null
  customerThemeOverrides?: ShopThemeOverrides | null
  active: boolean
}
