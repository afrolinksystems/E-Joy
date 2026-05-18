import { Button } from '../../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { EmptyRow } from '../../platform-console/components/EmptyRow'
import { StatusPill } from '../../platform-console/components/StatusPill'
import type { Application } from '../applications.types'

type ApplicationsTableProps = {
  applications: Application[]
  approveLoading: boolean
  onApprove: (application: Application) => void
  onReject: (application: Application) => void
}

export function ApplicationsTable({ applications, approveLoading, onApprove, onReject }: ApplicationsTableProps) {
  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow className="bg-muted/50 uppercase text-muted-foreground hover:bg-muted/50">
          <TableHead className="px-4">Restaurant</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created shop</TableHead>
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id}>
            <TableCell className="px-4 py-3 font-semibold">{application.shopName}</TableCell>
            <TableCell>
              {application.contactName}
              <div className="text-xs text-muted-foreground">{application.contactPhone}</div>
            </TableCell>
            <TableCell><StatusPill status={application.status} /></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{application.createdShopId ?? '-'}</TableCell>
            <TableCell className="pr-4 text-right">
              <div className="inline-flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={application.status !== 'PENDING' || approveLoading}
                  onClick={() => onApprove(application)}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={application.status !== 'PENDING'}
                  onClick={() => onReject(application)}
                >
                  Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {applications.length === 0 ? <EmptyRow colSpan={5} label="No applications found." /> : null}
      </TableBody>
    </Table>
  )
}
