import { Loader2, Plus } from 'lucide-react'
import type { StaffRole } from '../../../graphql/staff'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type { StaffFormState } from '../staff.types'
import { STAFF_ROLE_OPTIONS } from '../staff.utils'

type AddStaffDialogProps = {
  creating: boolean
  form: StaffFormState
  open: boolean
  onClose: () => void
  onFormChange: React.Dispatch<React.SetStateAction<StaffFormState>>
  onSubmit: () => void
}

export function AddStaffDialog({
  creating,
  form,
  open,
  onClose,
  onFormChange,
  onSubmit,
}: AddStaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus />
            Add new staff
          </DialogTitle>
          <DialogDescription>
            Initial password can be shared with the staff member; they should change it after first login when supported.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="staff-name">Name</FieldLabel>
            <Input
              id="staff-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="staff-phone">Phone</FieldLabel>
            <Input
              id="staff-phone"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, phone: event.target.value }))
              }
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="staff-password">Initial password</FieldLabel>
            <Input
              id="staff-password"
              type="password"
              value={form.password}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              autoComplete="new-password"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="staff-role">Role</FieldLabel>
            <NativeSelect
              id="staff-role"
              value={form.role}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  role: event.target.value as StaffRole,
                }))
              }
              className="w-full"
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={creating} onClick={onSubmit}>
            {creating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
