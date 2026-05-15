import { useQuery } from '@apollo/client/react'
import { useState } from 'react'
import { AUDIT_LOGS } from '../../../graphql/auditLogs'
import type { AuditLog } from '../audit.types'

export function useAuditLogs() {
  const [action, setAction] = useState('')
  const query = useQuery<{ platformAuditLogs: AuditLog[] }>(AUDIT_LOGS, {
    variables: { filter: { action: action || null, limit: 100 } },
  })

  return {
    action,
    rows: query.data?.platformAuditLogs ?? [],
    setAction,
  }
}
