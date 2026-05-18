import { useEffect, useMemo, useState } from 'react'
import type { StaffUserRow } from '../../../graphql/staff'
import type {
  StaffRoleFilter,
  StaffSortValue,
  StaffStatusFilter,
  StaffTableControlState,
} from '../staff-table.types'
import {
  getFilteredStaff,
  getPaginatedStaff,
  getSortedStaff,
  getStaffPageBounds,
  STAFF_PAGE_SIZE_OPTIONS,
} from '../staff-table.utils'

export function useStaffTableControls(rows: StaffUserRow[]) {
  const [search, setSearchValue] = useState('')
  const [role, setRoleValue] = useState<StaffRoleFilter>('all')
  const [status, setStatusValue] = useState<StaffStatusFilter>('all')
  const [sort, setSortValue] = useState<StaffSortValue>('name-asc')
  const [pageSize, setPageSizeValue] = useState(STAFF_PAGE_SIZE_OPTIONS[0])
  const [page, setPage] = useState(1)

  const controls: StaffTableControlState = useMemo(
    () => ({ page, pageSize, role, search, sort, status }),
    [page, pageSize, role, search, sort, status]
  )
  const filteredRows = useMemo(() => getFilteredStaff(rows, controls), [rows, controls])
  const sortedRows = useMemo(() => getSortedStaff(filteredRows, sort), [filteredRows, sort])
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const visibleRows = useMemo(() => getPaginatedStaff(sortedRows, page, pageSize), [sortedRows, page, pageSize])
  const bounds = getStaffPageBounds(sortedRows.length, page, pageSize)

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  return {
    actions: {
      clearFilters: () => {
        setSearchValue('')
        setRoleValue('all')
        setStatusValue('all')
        setSortValue('name-asc')
        setPage(1)
      },
      setPage,
      setPageSize: resetPage(setPageSizeValue),
      setRole: resetPage(setRoleValue),
      setSearch: resetPage(setSearchValue),
      setSort: resetPage(setSortValue),
      setStatus: resetPage(setStatusValue),
    },
    controls,
    view: {
      filteredCount: sortedRows.length,
      from: bounds.from,
      pageCount,
      rows: visibleRows,
      to: bounds.to,
      totalCount: rows.length,
    },
  }
}
