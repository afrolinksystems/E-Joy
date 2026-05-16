import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { TableRow } from '../../../graphql/tables'

type EditTableDialogProps = {
  capacity: string
  error: string | null
  number: string
  table: TableRow | null
  updating: boolean
  onCapacityChange: (value: string) => void
  onClose: () => void
  onNumberChange: (value: string) => void
  onSave: () => void
}

export function EditTableDialog({
  capacity,
  error,
  number,
  table,
  updating,
  onCapacityChange,
  onClose,
  onNumberChange,
  onSave,
}: EditTableDialogProps) {
  return (
    <Dialog open={Boolean(table)} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit table</DialogTitle>
          <DialogDescription>
            Update the display name and seat capacity for this table.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="table-number">Table number</FieldLabel>
            <Input
              id="table-number"
              type="text"
              value={number}
              onChange={(event) => onNumberChange(event.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="table-capacity">Capacity</FieldLabel>
            <Input
              id="table-capacity"
              type="number"
              min={1}
              max={99}
              value={capacity}
              onChange={(event) => onCapacityChange(event.target.value)}
              aria-invalid={Boolean(error)}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={updating} onClick={onSave}>
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
