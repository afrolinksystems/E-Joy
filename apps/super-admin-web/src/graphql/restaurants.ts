import { gql } from '@apollo/client'

export const SHOPS = gql`
  query ManagedShops($filter: ManagedShopsFilterInput) {
    managedShops(filter: $filter) {
      id
      name
      status
      updatedAt
      updatedBy
      orderCount
      revenueCent
    }
  }
`

export const SHOP_DETAIL = gql`
  query ManagedShop($shopId: String!) {
    managedShop(shopId: $shopId) {
      shop {
        id
        name
        status
        updatedAt
        updatedBy
        orderCount
        revenueCent
      }
      managers {
        id
        name
        phone
        role
        status
      }
      paymentConfig {
        id
        provider
        merchantId
        appId
        enabled
        testMode
        updatedBy
      }
    }
  }
`

export const UPDATE_SHOP = gql`
  mutation UpdateManagedShop($shopId: String!, $input: UpdateManagedShopInput!) {
    updateManagedShop(shopId: $shopId, input: $input)
  }
`

export const UPDATE_PAYMENT = gql`
  mutation UpdateShopPaymentConfig($shopId: String!, $input: UpdateShopPaymentConfigInput!) {
    updateShopPaymentConfig(shopId: $shopId, input: $input) {
      id
      provider
      merchantId
      appId
      enabled
      testMode
      updatedBy
    }
  }
`
