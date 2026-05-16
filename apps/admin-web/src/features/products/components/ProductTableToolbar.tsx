import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type {
  ProductTableControlActions,
  ProductTableControlState,
  ProductTableViewState,
} from '../products-table.types'
import { PRODUCT_PAGE_SIZE_OPTIONS } from '../products-table.utils'
import { ProductFilterPopover } from './ProductFilterPopover'
import { ProductSortPopover } from './ProductSortPopover'

type ProductTableToolbarProps = {
  actions: ProductTableControlActions
  controls: ProductTableControlState
  view: Pick<ProductTableViewState, 'categories' | 'filteredCount' | 'totalCount'>
}

export function ProductTableToolbar({ actions, controls, view }: ProductTableToolbarProps) {
  const activeFilterCount = [
    controls.search.trim(),
    controls.category !== 'all',
    controls.status !== 'all',
  ].filter(Boolean).length
  const hasControlsChanged =
    activeFilterCount > 0 ||
    controls.sort !== 'name-asc' ||
    controls.pageSize !== PRODUCT_PAGE_SIZE_OPTIONS[0]

  return (
    <CardContent className="shrink-0 border-b bg-card p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <InputGroup className="h-8 max-w-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={controls.search}
              onChange={(event) => actions.setSearch(event.target.value)}
              placeholder="Search products"
            />
          </InputGroup>
          <p className="hidden text-xs text-muted-foreground md:block">
            {view.filteredCount} of {view.totalCount}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProductFilterPopover
            actions={actions}
            activeFilterCount={activeFilterCount}
            controls={controls}
            categories={view.categories}
          />
          <ProductSortPopover actions={actions} controls={controls} />
          <NativeSelect
            aria-label="Rows per page"
            value={String(controls.pageSize)}
            onChange={(event) => actions.setPageSize(Number(event.target.value))}
            className="w-24"
          >
            {PRODUCT_PAGE_SIZE_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option} rows
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="button" variant="outline" onClick={actions.clearFilters} disabled={!hasControlsChanged}>
            {hasControlsChanged ? <X data-icon="inline-start" /> : <SlidersHorizontal data-icon="inline-start" />}
            Reset
          </Button>
        </div>
      </div>
    </CardContent>
  )
}
