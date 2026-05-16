import { Edit, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Field, FieldLabel } from '../../../components/ui/field'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type { StaffRole, StaffUserRow } from '../../../graphql/staff'
import { STAFF_ROLE_OPTIONS } from '../staff.utils'

type EditStaffRoleDialogProps = {
  editRole: StaffRole
  row: StaffUserRow | null
  updating: boolean
  onClose: () => void
  onRoleChange: (role: StaffRole) => void
  onSubmit: () => void
}

export function EditStaffRoleDialog({
  editRole,
  row,
  updating,
  onClose,
  onRoleChange,
  onSubmit,
}: EditStaffRoleDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit />
            Edit role
          </DialogTitle>
          <DialogDescription>
            {row ? (
              <>
                <span className="font-medium text-foreground">{row.name}</span>
                {' - '}
                <span className="font-mono">{row.phone}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="edit-staff-role">Role</FieldLabel>
          <NativeSelect
            id="edit-staff-role"
            value={editRole}
            onChange={(event) => onRoleChange(event.target.value as StaffRole)}
            className="w-full"
          >
            {STAFF_ROLE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={updating} onClick={onSubmit}>
            {updating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
