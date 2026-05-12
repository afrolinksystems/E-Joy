import { gql } from '@apollo/client'

export const SHOPS_QUERY = gql`
  query Shops {
    shops {
      id
      name
      active
    }
  }
`

export type ShopRow = { id: string; name: string; active: boolean }
