export type AuditLog = {
  id: string
  actorId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  metadata?: string | null
  createdAt: string
}
