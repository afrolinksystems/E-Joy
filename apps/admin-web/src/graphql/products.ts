import { gql } from '@apollo/client'

export const PRODUCTS = gql`
  query AdminProducts($shopId: String, $category: String) {
    products(shopId: $shopId, category: $category) {
      id
      shopId
      name
      category
      unitPrice
      imageUrl
      active
      status
    }
  }
`

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($shopId: String!, $input: CreateProductInput!) {
    createProduct(shopId: $shopId, input: $input) {
      id
      shopId
      name
      category
      unitPrice
      imageUrl
      active
      status
    }
  }
`

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($productId: String!, $shopId: String, $input: UpdateProductInput!) {
    updateProduct(productId: $productId, shopId: $shopId, input: $input) {
      id
      shopId
      name
      category
      unitPrice
      imageUrl
      active
      status
    }
  }
`

export const ARCHIVE_PRODUCT = gql`
  mutation ArchiveProduct($productId: String!, $shopId: String) {
    archiveProduct(productId: $productId, shopId: $shopId) {
      id
      status
    }
  }
`

export type ProductRow = {
  id: string
  shopId: string
  name: string
  category: string
  unitPrice: number
  imageUrl?: string | null
  active: boolean
  status: 'ACTIVE' | 'ARCHIVED'
}
