import { describe, expect, it } from 'vitest'
import { emptyStaffForm, roleBadge, statusBadge } from '../staff.utils'

describe('staff utils', () => {
  it('creates the default add-staff form', () => {
    expect(emptyStaffForm()).toEqual({
      name: '',
      phone: '',
      password: '',
      role: 'WAITER',
    })
  })

  it('maps known roles and statuses to friendly labels', () => {
    expect(roleBadge('MANAGER').label).toBe('Manager')
    expect(statusBadge('ACTIVE').label).toBe('Active')
  })
})

