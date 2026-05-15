import { useState } from 'react'
import type { StaffRole } from '../../../graphql/staff'
import type { StaffFormState } from '../staff.types'
import { emptyStaffForm } from '../staff.utils'

export function useStaffForm() {
  const [form, setForm] = useState<StaffFormState>(() => emptyStaffForm())

  function resetForm() {
    setForm(emptyStaffForm())
  }

  function setRole(role: StaffRole) {
    setForm((current) => ({ ...current, role }))
  }

  return { form, resetForm, setForm, setRole }
}

