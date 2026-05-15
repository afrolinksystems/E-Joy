import { EmptyRow } from '../../platform-console/components/EmptyRow'
import { formatDate } from '../../platform-console/platform-console.utils'
import type { AuditLog } from '../audit.types'

type AuditLogTableProps = {
  rows: AuditLog[]
}

export function AuditLogTable({ rows }: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-4 py-3">Time</th><th>Action</th><th>Actor</th><th>Target</th><th>Metadata</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 text-xs">{formatDate(row.createdAt)}</td>
              <td className="font-semibold">{row.action}</td>
              <td className="font-mono text-xs">{row.actorId ?? '-'}</td>
              <td className="font-mono text-xs">{row.targetType ?? '-'}:{row.targetId ?? '-'}</td>
              <td className="max-w-md truncate text-xs text-slate-500">{row.metadata ?? '-'}</td>
            </tr>
          ))}
          {rows.length === 0 ? <EmptyRow colSpan={5} label="No audit logs." /> : null}
        </tbody>
      </table>
    </div>
  )
}
