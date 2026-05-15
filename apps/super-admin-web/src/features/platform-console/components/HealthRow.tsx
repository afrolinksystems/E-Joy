type HealthRowProps = {
  label: string
  tone: 'green' | 'red' | 'blue'
  value: number
}

export function HealthRow({ label, tone, value }: HealthRowProps) {
  const color = tone === 'green'
    ? 'text-green-700 bg-green-50'
    : tone === 'red'
      ? 'text-red-700 bg-red-50'
      : 'text-blue-700 bg-blue-50'

  return (
    <div className={`rounded-lg px-4 py-3 ${color}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  )
}
