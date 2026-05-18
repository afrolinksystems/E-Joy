import { TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import type { StaffSortValue, StaffTableControlActions } from '../staff-table.types'
import { StaffTableSortButton } from './StaffTableSortButton'

type StaffTableHeaderProps = {
  onSortChange: StaffTableControlActions['setSort']
  sort: StaffSortValue
}

const SORT_BY_COLUMN = {
  name: ['name-asc', 'name-desc'],
  phone: ['phone-asc', 'phone-desc'],
  role: ['role-asc', 'role-desc'],
  status: ['status-asc', 'status-desc'],
} as const

export function StaffTableHeader({ onSortChange, sort }: StaffTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 bg-card">
      <TableRow className="bg-muted/50 uppercase tracking-wide text-muted-foreground hover:bg-muted/50">
        <TableHead className="px-4">
          <StaffTableSortButton label="Name" nextSort={nextSort(sort, SORT_BY_COLUMN.name)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4">
          <StaffTableSortButton label="Phone" nextSort={nextSort(sort, SORT_BY_COLUMN.phone)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4">
          <StaffTableSortButton label="Role" nextSort={nextSort(sort, SORT_BY_COLUMN.role)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4">
          <StaffTableSortButton label="Status" nextSort={nextSort(sort, SORT_BY_COLUMN.status)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function nextSort(current: StaffSortValue, options: readonly [StaffSortValue, StaffSortValue]) {
  return current === options[0] ? options[1] : options[0]
}
