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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Restaurant</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Created shop</th>
            <th className="pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((application) => (
            <tr key={application.id}>
              <td className="px-4 py-3 font-semibold">{application.shopName}</td>
              <td>{application.contactName}<div className="text-xs text-slate-500">{application.contactPhone}</div></td>
              <td><StatusPill status={application.status} /></td>
              <td className="font-mono text-xs text-slate-500">{application.createdShopId ?? '-'}</td>
              <td className="pr-4 text-right">
                <button disabled={application.status !== 'PENDING' || approveLoading} onClick={() => onApprove(application)} className="mr-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Approve</button>
                <button disabled={application.status !== 'PENDING'} onClick={() => onReject(application)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Reject</button>
              </td>
            </tr>
          ))}
          {applications.length === 0 ? <EmptyRow colSpan={5} label="No applications found." /> : null}
        </tbody>
      </table>
    </div>
  )
}
