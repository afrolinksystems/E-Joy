import { gql } from '@apollo/client'

export const SHOP = gql`
  query Shop($id: String!) {
    shop(id: $id) {
      id
      name
      description
      contactPhone
      logoUrl
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
      active
    }
  }
`

export type ShopConfigRow = {
  id: string
  name: string
  description?: string | null
  contactPhone?: string | null
  logoUrl?: string | null
  active: boolean
}
