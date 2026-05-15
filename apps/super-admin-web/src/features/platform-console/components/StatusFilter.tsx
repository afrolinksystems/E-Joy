import type { Status } from '../platform-console.types'

type StatusFilterProps = {
  onChange: (value: Status | '') => void
  value: Status | ''
}

export function StatusFilter({ onChange, value }: StatusFilterProps) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as Status | '')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
      <option value="">All</option>
      <option value="PENDING">Pending</option>
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
    </select>
  )
}
