import { TableHeader } from './TableHeader'

type DataListProps = {
  actionLabel: string
  onAction: () => void
  rowAction?: (index: number) => void
  rows: string[][]
  title: string
}

export function DataList({ actionLabel, onAction, rowAction, rows, title }: DataListProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <TableHeader title={title} action={<button onClick={onAction} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{actionLabel}</button>} />
      <div className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <div key={`${row[0]}-${index}`} className="flex items-center justify-between gap-3 p-4 text-sm">
            <div>
              <div className="font-semibold">{row[0]}</div>
              <div className="text-xs text-slate-500">{row[1]}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{row[2]}</span>
              {rowAction ? <button onClick={() => rowAction(index)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">Disable</button> : null}
            </div>
          </div>
        ))}
        {rows.length === 0 ? <div className="p-5 text-sm text-slate-500">No records.</div> : null}
      </div>
    </section>
  )
}
