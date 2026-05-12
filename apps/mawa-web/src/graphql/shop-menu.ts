import { gql } from "@apollo/client";

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
`;

export type ShopMenuProduct = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  imageUrl?: string | null;
};
