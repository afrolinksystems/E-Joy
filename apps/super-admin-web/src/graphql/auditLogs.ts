import { gql } from '@apollo/client'

export const AUDIT_LOGS = gql`
  query PlatformAuditLogs($filter: PlatformAuditLogFilterInput) {
    platformAuditLogs(filter: $filter) {
      id
      actorId
      action
      targetType
      targetId
      metadata
      createdAt
    }
  }
`
