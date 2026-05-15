import { useQuery } from '@apollo/client/react'
import { DASHBOARD } from '../../../graphql/dashboard'
import type { Dashboard } from '../dashboard.types'

export function usePlatformDashboard() {
  return useQuery<{ platformDashboard: Dashboard }>(DASHBOARD)
}
