import type { StaffRole, StaffStatus, StaffUserRow } from '../../graphql/staff'

export type StaffRoleFilter = 'all' | StaffRole
export type StaffStatusFilter = 'all' | StaffStatus

export type StaffSortValue =
  | 'name-asc'
  | 'name-desc'
  | 'phone-asc'
  | 'phone-desc'
  | 'role-asc'
  | 'role-desc'
  | 'status-asc'
  | 'status-desc'

export type StaffTableControlState = {
  page: number
  pageSize: number
  role: StaffRoleFilter
  search: string
  sort: StaffSortValue
  status: StaffStatusFilter
}

export type StaffTableControlActions = {
  clearFilters: () => void
  setPage: (value: number) => void
  setPageSize: (value: number) => void
  setRole: (value: StaffRoleFilter) => void
  setSearch: (value: string) => void
  setSort: (value: StaffSortValue) => void
  setStatus: (value: StaffStatusFilter) => void
}

export type StaffTableViewState = {
  filteredCount: number
  from: number
  pageCount: number
  rows: StaffUserRow[]
  to: number
  totalCount: number
}
