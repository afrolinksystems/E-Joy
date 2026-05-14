import { gql } from '@apollo/client'

export const STAFF_LOGIN = gql`
  mutation StaffLogin($phone: String!, $password: String!) {
    staffLogin(phone: $phone, password: $password) {
      accessToken
      expiresAt
      role
      shopId
      scope
    }
  }
`

export const REFRESH_SESSION = gql`
  mutation RefreshSession {
    refreshSession {
      accessToken
      expiresAt
      role
      shopId
      scope
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

export const MERCHANT_ME = gql`
  query MerchantMe {
    merchantMe {
      id
      name
      phone
      role
      shopId
      scope
      shop {
        id
        name
        logoUrl
        active
      }
    }
  }
`

export const SUBMIT_SHOP_APPLICATION = gql`
  mutation SubmitShopApplication($input: CreateShopApplicationInput!) {
    submitShopApplication(input: $input) {
      id
      shopName
      contactName
      contactPhone
      status
    }
  }
`

export type StaffLoginData = {
  staffLogin: {
    accessToken: string
    expiresAt: string
    role: string
    shopId: string
    scope: string[]
  }
}

export type RefreshSessionData = {
  refreshSession: {
    accessToken: string
    expiresAt: string
    role: string
    shopId?: string | null
    scope: string[]
  }
}

export type MerchantMeData = {
  merchantMe: {
    id: string
    name: string
    phone: string
    role: string
    shopId: string
    scope: string[]
    shop: {
      id: string
      name: string
      logoUrl?: string | null
      active: boolean
    }
  }
}

export type SubmitShopApplicationData = {
  submitShopApplication: {
    id: string
    shopName: string
    contactName: string
    contactPhone: string
    status: string
  }
}
