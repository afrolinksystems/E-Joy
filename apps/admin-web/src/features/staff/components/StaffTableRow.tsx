import { Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { TableCell, TableRow } from '../../../components/ui/table'
import type { StaffUserRow } from '../../../graphql/staff'
import { RoleBadge } from './RoleBadge'
import { StaffStatusBadge } from './StaffStatusBadge'

type StaffTableRowProps = {
  deleteLoading: boolean
  row: StaffUserRow
  onDelete: (row: StaffUserRow) => void
  onEdit: (row: StaffUserRow) => void
}

export function StaffTableRow({
  deleteLoading,
  row,
  onDelete,
  onEdit,
}: StaffTableRowProps) {
  return (
    <TableRow>
      <TableCell className="px-4 py-2">
        <span className="block max-w-[20rem] truncate text-sm font-semibold">{row.name}</span>
      </TableCell>
      <TableCell className="px-4 py-2 font-mono text-sm text-muted-foreground">
        {row.phone}
      </TableCell>
      <TableCell className="px-4 py-2">
        <RoleBadge role={row.role} />
      </TableCell>
      <TableCell className="px-4 py-2">
        <StaffStatusBadge status={row.status} />
      </TableCell>
      <TableCell className="px-4 py-2 text-right">
        <div className="inline-flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)} title="Edit role">
            <Edit data-icon="inline-start" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteLoading}
            onClick={() => onDelete(row)}
            title="Remove staff"
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
