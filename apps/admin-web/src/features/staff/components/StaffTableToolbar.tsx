import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type {
  StaffTableControlActions,
  StaffTableControlState,
  StaffTableViewState,
} from '../staff-table.types'
import { STAFF_PAGE_SIZE_OPTIONS } from '../staff-table.utils'
import { StaffFilterPopover } from './StaffFilterPopover'
import { StaffSortPopover } from './StaffSortPopover'

type StaffTableToolbarProps = {
  actions: StaffTableControlActions
  controls: StaffTableControlState
  view: Pick<StaffTableViewState, 'filteredCount' | 'totalCount'>
}

export function StaffTableToolbar({ actions, controls, view }: StaffTableToolbarProps) {
  const activeFilterCount = [
    controls.search.trim(),
    controls.role !== 'all',
    controls.status !== 'all',
  ].filter(Boolean).length
  const hasControlsChanged =
    activeFilterCount > 0 ||
    controls.sort !== 'name-asc' ||
    controls.pageSize !== STAFF_PAGE_SIZE_OPTIONS[0]

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
              placeholder="Search staff"
            />
          </InputGroup>
          <p className="hidden text-xs text-muted-foreground md:block">
            {view.filteredCount} of {view.totalCount}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StaffFilterPopover actions={actions} activeFilterCount={activeFilterCount} controls={controls} />
          <StaffSortPopover actions={actions} controls={controls} />
          <NativeSelect
            aria-label="Rows per page"
            value={String(controls.pageSize)}
            onChange={(event) => actions.setPageSize(Number(event.target.value))}
            className="w-24"
          >
            {STAFF_PAGE_SIZE_OPTIONS.map((option) => (
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
