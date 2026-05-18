import { Card, CardContent } from '../../../components/ui/card'

type MiniStatProps = {
  label: string
  value: string | number
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
