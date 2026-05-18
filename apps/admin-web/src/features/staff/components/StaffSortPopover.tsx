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
  StaffSortValue,
  StaffTableControlActions,
  StaffTableControlState,
} from '../staff-table.types'
import { STAFF_SORT_OPTIONS } from '../staff-table.utils'

type StaffSortPopoverProps = {
  actions: StaffTableControlActions
  controls: StaffTableControlState
}

export function StaffSortPopover({ actions, controls }: StaffSortPopoverProps) {
  const currentSort = STAFF_SORT_OPTIONS.find((option) => option.value === controls.sort)

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
          <PopoverTitle>Sort staff</PopoverTitle>
          <PopoverDescription>{currentSort?.label ?? 'Choose staff order'}</PopoverDescription>
        </PopoverHeader>
        <Field>
          <FieldLabel htmlFor="staff-sort">Order by</FieldLabel>
          <NativeSelect
            id="staff-sort"
            value={controls.sort}
            onChange={(event) => actions.setSort(event.target.value as StaffSortValue)}
            className="w-full"
          >
            {STAFF_SORT_OPTIONS.map((option) => (
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
