import { StatusFilter } from '../platform-console/components/StatusFilter'
import { TableHeader } from '../platform-console/components/TableHeader'
import { ApplicationsTable } from './components/ApplicationsTable'
import { TemporaryPasswordNotice } from './components/TemporaryPasswordNotice'
import { useApplicationsPage } from './hooks/useApplicationsPage'

export function ApplicationsPage() {
  const page = useApplicationsPage()

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <TableHeader title="Restaurant applications" action={<StatusFilter value={page.status} onChange={page.setStatus} />} />
      <TemporaryPasswordNotice password={page.lastPassword} />
      <ApplicationsTable
        applications={page.applications}
        approveLoading={page.approveLoading}
        onApprove={(application) => void page.approveApplication(application)}
        onReject={(application) => void page.rejectApplication(application)}
      />
    </section>
  )
}
