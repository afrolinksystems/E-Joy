import { Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Spinner } from '../../../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import type { StaffUserRow } from '../../../graphql/staff'
import { RoleBadge } from './RoleBadge'
import { StaffStatusBadge } from './StaffStatusBadge'

type StaffTableProps = {
  deleteLoading: boolean
  loading: boolean
  rows: StaffUserRow[]
  onDelete: (row: StaffUserRow) => void
  onEdit: (row: StaffUserRow) => void
}

export function StaffTable({
  deleteLoading,
  loading,
  rows,
  onDelete,
  onEdit,
}: StaffTableProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Phone</TableHead>
              <TableHead className="px-4">Role</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Spinner className="mx-auto size-8" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No staff yet. Click &quot;Add new staff&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3 font-medium">{row.name}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-muted-foreground">
                    {row.phone}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <RoleBadge role={row.role} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StaffStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
