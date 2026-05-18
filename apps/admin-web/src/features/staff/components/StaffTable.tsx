import { Card, CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Spinner } from '../../../components/ui/spinner'
import { Table, TableBody, TableCell, TableRow } from '../../../components/ui/table'
import type { StaffUserRow } from '../../../graphql/staff'
import type {
  StaffTableControlActions,
  StaffTableControlState,
  StaffTableViewState,
} from '../staff-table.types'
import { StaffTableHeader } from './StaffTableHeader'
import { StaffTablePagination } from './StaffTablePagination'
import { StaffTableRow } from './StaffTableRow'
import { StaffTableToolbar } from './StaffTableToolbar'

type StaffTableProps = {
  actions: StaffTableControlActions
  controls: StaffTableControlState
  deleteLoading: boolean
  loading: boolean
  rows: StaffUserRow[]
  view: StaffTableViewState
  onDelete: (row: StaffUserRow) => void
  onEdit: (row: StaffUserRow) => void
}

export function StaffTable({
  actions,
  controls,
  deleteLoading,
  loading,
  rows,
  view,
  onDelete,
  onEdit,
}: StaffTableProps) {
  return (
    <Card className="flex min-h-0 flex-1 overflow-hidden shadow-sm">
      <StaffTableToolbar actions={actions} controls={controls} view={view} />
      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <Table className="min-w-[760px]">
          <StaffTableHeader sort={controls.sort} onSortChange={actions.setSort} />
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Spinner className="mx-auto size-8" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <Empty>
                    <EmptyMedia variant="icon" />
                    <EmptyHeader>
                      <EmptyTitle>No staff found</EmptyTitle>
                      <EmptyDescription>Try adjusting filters or add a new staff account.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <StaffTableRow
                  key={row.id}
                  deleteLoading={deleteLoading}
                  row={row}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <StaffTablePagination actions={actions} controls={controls} view={view} />
    </Card>
  )
}
