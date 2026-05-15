type MiniStatProps = {
  label: string
  value: string | number
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  )
}
