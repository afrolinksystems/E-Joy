import { ArrowDownAZ, ArrowDownUp, ArrowUpZA } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { ProductSortValue, ProductTableControlActions } from '../products-table.types'

type ProductTableSortButtonProps = {
  label: string
  nextSort: ProductSortValue
  onSortChange: ProductTableControlActions['setSort']
  sort: ProductSortValue
}

export function ProductTableSortButton({
  label,
  nextSort,
  onSortChange,
  sort,
}: ProductTableSortButtonProps) {
  const isCurrent = sort === nextSort || sort === reverseSort(nextSort)
  const Icon = !isCurrent ? ArrowDownUp : sort.endsWith('asc') ? ArrowDownAZ : ArrowUpZA

  return (
    <Button type="button" variant="ghost" size="sm" className="px-0 font-semibold uppercase" onClick={() => onSortChange(nextSort)}>
      {label}
      <Icon data-icon="inline-end" />
    </Button>
  )
}

function reverseSort(sort: ProductSortValue): ProductSortValue {
  return (sort.endsWith('asc') ? sort.replace('asc', 'desc') : sort.replace('desc', 'asc')) as ProductSortValue
}
