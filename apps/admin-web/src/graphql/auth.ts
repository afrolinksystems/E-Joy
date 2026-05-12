import { gql } from '@apollo/client'

export const STAFF_LOGIN = gql`
  mutation StaffLogin($phone: String!, $password: String!) {
    staffLogin(phone: $phone, password: $password) {
      accessToken
      role
      shopId
      scope
    }
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

export type StaffLoginData = {
  staffLogin: {
    accessToken: string
    role: string
    shopId: string
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
