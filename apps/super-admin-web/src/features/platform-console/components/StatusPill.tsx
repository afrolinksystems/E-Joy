import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import type { Status } from '../platform-console.types'

type StatusPillProps = {
  status: Status
}

export function StatusPill({ status }: StatusPillProps) {
  const Icon = status === 'APPROVED' ? CheckCircle2 : status === 'REJECTED' ? XCircle : AlertTriangle
  const variant = status === 'REJECTED' ? 'destructive' : 'secondary'

  return (
    <Badge variant={variant}>
      <Icon data-icon="inline-start" />
      {status}
    </Badge>
  )
}
