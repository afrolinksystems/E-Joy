import { ArrowDownUp } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Field, FieldLabel } from '../../../components/ui/field'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../../components/ui/popover'
import type {
  ProductSortValue,
  ProductTableControlActions,
  ProductTableControlState,
} from '../products-table.types'
import { PRODUCT_SORT_OPTIONS } from '../products-table.utils'

type ProductSortPopoverProps = {
  actions: ProductTableControlActions
  controls: ProductTableControlState
}

export function ProductSortPopover({ actions, controls }: ProductSortPopoverProps) {
  const currentSort = PRODUCT_SORT_OPTIONS.find((option) => option.value === controls.sort)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline">
            <ArrowDownUp data-icon="inline-start" />
            Sort
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Sort products</PopoverTitle>
          <PopoverDescription>{currentSort?.label ?? 'Choose product order'}</PopoverDescription>
        </PopoverHeader>
        <Field>
          <FieldLabel htmlFor="product-sort">Order by</FieldLabel>
          <NativeSelect
            id="product-sort"
            value={controls.sort}
            onChange={(event) => actions.setSort(event.target.value as ProductSortValue)}
            className="w-full"
          >
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </PopoverContent>
    </Popover>
  )
}
