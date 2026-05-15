import type { StaffRole } from '../../graphql/staff'
import type { BadgeConfig, StaffFormState } from './staff.types'

export const STAFF_ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'WAITER', label: 'Waiter' },
]

export function emptyStaffForm(): StaffFormState {
  return {
    name: '',
    phone: '',
    password: '',
    role: 'WAITER',
  }
}

export function roleBadge(role: string): BadgeConfig {
  const normalized = role.toUpperCase()
  switch (normalized) {
    case 'MANAGER':
      return {
        label: 'Manager',
        className: 'bg-red-100 text-red-900 ring-1 ring-red-200',
      }
    case 'CASHIER':
      return {
        label: 'Cashier',
        className: 'bg-blue-100 text-blue-900 ring-1 ring-blue-200',
      }
    case 'KITCHEN':
      return {
        label: 'Kitchen',
        className: 'bg-orange-100 text-orange-900 ring-1 ring-orange-200',
      }
    case 'WAITER':
      return {
        label: 'Waiter',
        className: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
      }
    default:
      return {
        label: role,
        className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      }
  }
}

export function statusBadge(status: string): BadgeConfig {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') {
    return { label: 'Active', className: 'bg-emerald-50 text-emerald-800' }
  }
  if (normalized === 'INACTIVE') {
    return { label: 'Inactive', className: 'bg-slate-100 text-slate-600' }
  }
  if (normalized === 'SUSPENDED') {
    return { label: 'Suspended', className: 'bg-amber-50 text-amber-900' }
  }
  return { label: status, className: 'bg-slate-50 text-slate-600' }
}

