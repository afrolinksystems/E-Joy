import { ArrowDownAZ, ArrowDownUp, ArrowUpZA } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { StaffSortValue, StaffTableControlActions } from '../staff-table.types'

type StaffTableSortButtonProps = {
  label: string
  nextSort: StaffSortValue
  onSortChange: StaffTableControlActions['setSort']
  sort: StaffSortValue
}

export function StaffTableSortButton({
  label,
  nextSort,
  onSortChange,
  sort,
}: StaffTableSortButtonProps) {
  const isCurrent = sort === nextSort || sort === reverseSort(nextSort)
  const Icon = !isCurrent ? ArrowDownUp : sort.endsWith('asc') ? ArrowDownAZ : ArrowUpZA

  return (
    <Button type="button" variant="ghost" size="sm" className="px-0 font-semibold uppercase" onClick={() => onSortChange(nextSort)}>
      {label}
      <Icon data-icon="inline-end" />
    </Button>
  )
}

function reverseSort(sort: StaffSortValue): StaffSortValue {
  return (sort.endsWith('asc') ? sort.replace('asc', 'desc') : sort.replace('desc', 'asc')) as StaffSortValue
}
