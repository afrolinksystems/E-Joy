import { gql } from '@apollo/client'

/** 顾客端公开查询：门店上架商品，unitPrice 为整数（分） */
export const SHOP_MENU = gql`
  query ShopMenu($shopId: String!) {
    shopMenu(shopId: $shopId) {
      id
      name
      category
      unitPrice
      imageUrl
    }
  }
`

export type ShopMenuProduct = {
  id: string
  name: string
  category: string
  unitPrice: number
  imageUrl?: string | null
}
