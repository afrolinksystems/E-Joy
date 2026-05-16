import type { StaffUserRow } from '../../graphql/staff'
import type { StaffSortValue, StaffTableControlState } from './staff-table.types'

export const STAFF_PAGE_SIZE_OPTIONS = [10, 25, 50]

export const STAFF_SORT_OPTIONS: { label: string; value: StaffSortValue }[] = [
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
  { label: 'Phone A-Z', value: 'phone-asc' },
  { label: 'Phone Z-A', value: 'phone-desc' },
  { label: 'Role A-Z', value: 'role-asc' },
  { label: 'Role Z-A', value: 'role-desc' },
  { label: 'Status A-Z', value: 'status-asc' },
  { label: 'Status Z-A', value: 'status-desc' },
]

export function getFilteredStaff(rows: StaffUserRow[], controls: StaffTableControlState) {
  const query = controls.search.trim().toLowerCase()

  return rows.filter((row) => {
    const matchesSearch =
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.phone.toLowerCase().includes(query) ||
      row.role.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query)
    const matchesRole = controls.role === 'all' || row.role === controls.role
    const matchesStatus = controls.status === 'all' || row.status === controls.status

    return matchesSearch && matchesRole && matchesStatus
  })
}

export function getSortedStaff(rows: StaffUserRow[], sort: StaffSortValue) {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'phone-asc':
        return a.phone.localeCompare(b.phone)
      case 'phone-desc':
        return b.phone.localeCompare(a.phone)
      case 'role-asc':
        return a.role.localeCompare(b.role)
      case 'role-desc':
        return b.role.localeCompare(a.role)
      case 'status-asc':
        return a.status.localeCompare(b.status)
      case 'status-desc':
        return b.status.localeCompare(a.status)
      case 'name-asc':
      default:
        return a.name.localeCompare(b.name)
    }
  })
}

export function getPaginatedStaff(rows: StaffUserRow[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

export function getStaffPageBounds(filteredCount: number, page: number, pageSize: number) {
  if (filteredCount === 0) return { from: 0, to: 0 }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, filteredCount)

  return { from, to }
}
