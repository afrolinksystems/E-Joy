import { gql } from '@apollo/client'

export const TABLE_STATUS_CHANGED = gql`
  subscription TableStatusChanged($shopId: String!) {
    tableStatusChanged(shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const GET_TABLES = gql`
  query GetTables($shopId: String!) {
    getTables(shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const UPDATE_TABLE_POSITION = gql`
  mutation UpdateTablePosition($id: String!, $x: Float!, $y: Float!, $shopId: String) {
    updateTablePosition(id: $id, x: $x, y: $y, shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const UPDATE_TABLE_POSITIONS = gql`
  mutation UpdateTablePositions($input: [TablePositionInput!]!, $shopId: String) {
    updateTablePositions(input: $input, shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const CREATE_TABLE = gql`
  mutation CreateTable($shopId: String) {
    createTable(shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const UPDATE_TABLE = gql`
  mutation UpdateTable(
    $id: String!
    $tableNumber: String!
    $capacity: Int
    $shopId: String
  ) {
    updateTable(id: $id, tableNumber: $tableNumber, capacity: $capacity, shopId: $shopId) {
      id
      tableNumber
      capacity
      posX
      posY
      status
      shopId
    }
  }
`

export const DELETE_TABLE = gql`
  mutation DeleteTable($id: String!, $shopId: String) {
    deleteTable(id: $id, shopId: $shopId)
  }
`

export type TableRow = {
  id: string
  tableNumber: string
  capacity: number
  posX: number
  posY: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY'
  shopId: string
}

export type GetTablesData = {
  getTables: TableRow[]
}

export type TableStatusChangedData = {
  tableStatusChanged: TableRow
}

export type UpdateTableData = {
  updateTable: TableRow
}
