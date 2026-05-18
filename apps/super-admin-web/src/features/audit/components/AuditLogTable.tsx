import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { EmptyRow } from '../../platform-console/components/EmptyRow'
import { formatDate } from '../../platform-console/platform-console.utils'
import type { AuditLog } from '../audit.types'

type AuditLogTableProps = {
  rows: AuditLog[]
}

export function AuditLogTable({ rows }: AuditLogTableProps) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow className="bg-muted/50 uppercase text-muted-foreground hover:bg-muted/50">
          <TableHead className="px-4">Time</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="px-4 py-3 text-xs">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="font-semibold">{row.action}</TableCell>
            <TableCell className="font-mono text-xs">{row.actorId ?? '-'}</TableCell>
            <TableCell className="font-mono text-xs">{row.targetType ?? '-'}:{row.targetId ?? '-'}</TableCell>
            <TableCell className="max-w-md truncate text-xs text-muted-foreground">{row.metadata ?? '-'}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 ? <EmptyRow colSpan={5} label="No audit logs." /> : null}
      </TableBody>
    </Table>
  )
}
