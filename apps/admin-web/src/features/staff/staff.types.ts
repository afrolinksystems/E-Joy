import type { StaffRole } from '../../graphql/staff'

export type StaffFormState = {
  name: string
  phone: string
  password: string
  role: StaffRole
}

export type BadgeConfig = {
  label: string
  className: string
}

