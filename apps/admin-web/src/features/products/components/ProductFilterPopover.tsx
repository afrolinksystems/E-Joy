import { Filter } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field'
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
  ProductStatusFilter,
  ProductTableControlActions,
  ProductTableControlState,
} from '../products-table.types'

type ProductFilterPopoverProps = {
  actions: ProductTableControlActions
  activeFilterCount: number
  categories: string[]
  controls: ProductTableControlState
}

export function ProductFilterPopover({
  actions,
  activeFilterCount,
  categories,
  controls,
}: ProductFilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline">
            <Filter data-icon="inline-start" />
            Filter
            {activeFilterCount > 0 ? <Badge variant="secondary">{activeFilterCount}</Badge> : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Filter products</PopoverTitle>
          <PopoverDescription>Limit the menu by category or availability.</PopoverDescription>
        </PopoverHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product-category-filter">Category</FieldLabel>
            <NativeSelect
              id="product-category-filter"
              value={controls.category}
              onChange={(event) => actions.setCategory(event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="all">All categories</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category} value={category}>
                  {category}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="product-status-filter">Status</FieldLabel>
            <NativeSelect
              id="product-status-filter"
              value={controls.status}
              onChange={(event) => actions.setStatus(event.target.value as ProductStatusFilter)}
              className="w-full"
            >
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              <NativeSelectOption value="active">Active</NativeSelectOption>
              <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
            </NativeSelect>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  )
}
