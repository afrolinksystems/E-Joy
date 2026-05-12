import { gql } from '@apollo/client'

export const GET_STAFF_LIST = gql`
  query GetStaffList($shopId: String!) {
    getStaffList(shopId: $shopId) {
      id
      name
      phone
      role
      shopId
      status
    }
  }
`

export const CREATE_STAFF_ACCOUNT = gql`
  mutation CreateStaffAccount($input: CreateStaffAccountInput!) {
    createStaffAccount(input: $input) {
      id
      name
      phone
      role
      shopId
      status
    }
  }
`

export const UPDATE_STAFF_ROLE = gql`
  mutation UpdateStaffRole($input: UpdateStaffRoleInput!) {
    updateStaffRole(input: $input) {
      id
      role
    }
  }
`

export const DELETE_STAFF_USER = gql`
  mutation DeleteStaffUser($userId: String!) {
    deleteStaffUser(userId: $userId)
  }
`

export type StaffRole = 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN'
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type StaffUserRow = {
  id: string
  name: string
  phone: string
  role: StaffRole
  shopId: string
  status: StaffStatus
}

export type GetStaffListData = {
  getStaffList: StaffUserRow[]
}
