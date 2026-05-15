import { useMutation, useQuery } from '@apollo/client/react'
import { useState } from 'react'
import {
  APPLICATIONS,
  APPROVE_APPLICATION,
  REJECT_APPLICATION,
} from '../../../graphql/applications'
import type { Status } from '../../platform-console/platform-console.types'
import type { Application } from '../applications.types'

export function useApplicationsPage() {
  const [status, setStatus] = useState<Status | ''>('')
  const [lastPassword, setLastPassword] = useState('')
  const query = useQuery<{ shopApplications: Application[] }>(APPLICATIONS, {
    variables: { status: status || null },
  })
  const [approve, approveState] = useMutation<{
    approveShopApplication?: { temporaryPassword?: string | null }
  }>(APPROVE_APPLICATION)
  const [reject] = useMutation(REJECT_APPLICATION)
  const applications = query.data?.shopApplications ?? []

  async function approveApplication(application: Application) {
    const result = await approve({ variables: { shopId: application.id, input: {} } })
    const password = result.data?.approveShopApplication?.temporaryPassword
    if (password) setLastPassword(`${application.shopName}: ${password}`)
    await query.refetch()
  }

  async function rejectApplication(application: Application) {
    const reason = window.prompt(`Reject ${application.shopName}. Reason:`)
    if (!reason) return
    await reject({ variables: { shopId: application.id, reason } })
    await query.refetch()
  }

  return {
    applications,
    approveApplication,
    approveLoading: approveState.loading,
    lastPassword,
    rejectApplication,
    setStatus,
    status,
  }
}
