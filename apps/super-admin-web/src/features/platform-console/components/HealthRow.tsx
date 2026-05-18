import { Card, CardContent } from '../../../components/ui/card'

type HealthRowProps = {
  label: string
  tone: 'green' | 'red' | 'blue'
  value: number
}

export function HealthRow({ label, tone, value }: HealthRowProps) {
  const toneClass = tone === 'red' ? 'text-destructive' : tone === 'green' ? 'text-primary' : 'text-foreground'

  return (
    <Card size="sm">
      <CardContent>
        <div className="text-sm font-semibold text-muted-foreground">{label}</div>
        <div className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
