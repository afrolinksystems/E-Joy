import type { LucideIcon } from 'lucide-react'

export type Page = 'dashboard' | 'applications' | 'restaurants' | 'marketing' | 'operations' | 'audit'
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ShopStatus = 'ONLINE' | 'OFFLINE'

export type PlatformMe = {
  id: string
  name: string
  identifier: string
  platformRole: string
  scope: string[]
}

export type NavItem = readonly [Page, LucideIcon, string]
