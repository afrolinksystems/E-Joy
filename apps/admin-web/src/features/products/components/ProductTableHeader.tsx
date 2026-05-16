import { TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import type { ProductSortValue, ProductTableControlActions } from '../products-table.types'
import { ProductTableSortButton } from './ProductTableSortButton'

type ProductTableHeaderProps = {
  onSortChange: ProductTableControlActions['setSort']
  sort: ProductSortValue
}

const SORT_BY_COLUMN = {
  category: ['category-asc', 'category-desc'],
  name: ['name-asc', 'name-desc'],
  price: ['price-asc', 'price-desc'],
  status: ['status-asc', 'status-desc'],
} as const

export function ProductTableHeader({ onSortChange, sort }: ProductTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 bg-card">
      <TableRow className="bg-muted/50 uppercase tracking-wide text-muted-foreground hover:bg-muted/50">
        <TableHead className="w-20 px-4">Img</TableHead>
        <TableHead className="px-4">
          <ProductTableSortButton label="Name" nextSort={nextSort(sort, SORT_BY_COLUMN.name)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4">
          <ProductTableSortButton
            label="Category"
            nextSort={nextSort(sort, SORT_BY_COLUMN.category)}
            onSortChange={onSortChange}
            sort={sort}
          />
        </TableHead>
        <TableHead className="px-4 text-right">
          <ProductTableSortButton label="Price (Birr)" nextSort={nextSort(sort, SORT_BY_COLUMN.price)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4 text-center">
          <ProductTableSortButton label="Status" nextSort={nextSort(sort, SORT_BY_COLUMN.status)} onSortChange={onSortChange} sort={sort} />
        </TableHead>
        <TableHead className="px-4 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function nextSort(current: ProductSortValue, options: readonly [ProductSortValue, ProductSortValue]) {
  return current === options[0] ? options[1] : options[0]
}
