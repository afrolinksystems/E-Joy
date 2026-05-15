import { SearchBox } from '../platform-console/components/SearchBox'
import { TableHeader } from '../platform-console/components/TableHeader'
import { AuditLogTable } from './components/AuditLogTable'
import { useAuditLogs } from './hooks/useAuditLogs'

export function AuditPage() {
  const audit = useAuditLogs()

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <TableHeader title="Audit logs" action={<SearchBox value={audit.action} onChange={audit.setAction} placeholder="Filter action" />} />
      <AuditLogTable rows={audit.rows} />
    </section>
  )
}
