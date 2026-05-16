import { Filter } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
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
  StaffRoleFilter,
  StaffStatusFilter,
  StaffTableControlActions,
  StaffTableControlState,
} from '../staff-table.types'
import { STAFF_ROLE_OPTIONS } from '../staff.utils'

type StaffFilterPopoverProps = {
  actions: StaffTableControlActions
  activeFilterCount: number
  controls: StaffTableControlState
}

export function StaffFilterPopover({
  actions,
  activeFilterCount,
  controls,
}: StaffFilterPopoverProps) {
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
          <PopoverTitle>Filter staff</PopoverTitle>
          <PopoverDescription>Limit staff by role or account status.</PopoverDescription>
        </PopoverHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="staff-role-filter">Role</FieldLabel>
            <NativeSelect
              id="staff-role-filter"
              value={controls.role}
              onChange={(event) => actions.setRole(event.target.value as StaffRoleFilter)}
              className="w-full"
            >
              <NativeSelectOption value="all">All roles</NativeSelectOption>
              {STAFF_ROLE_OPTIONS.map((role) => (
                <NativeSelectOption key={role.value} value={role.value}>
                  {role.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="staff-status-filter">Status</FieldLabel>
            <NativeSelect
              id="staff-status-filter"
              value={controls.status}
              onChange={(event) => actions.setStatus(event.target.value as StaffStatusFilter)}
              className="w-full"
            >
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
              <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
              <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
            </NativeSelect>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  )
}
