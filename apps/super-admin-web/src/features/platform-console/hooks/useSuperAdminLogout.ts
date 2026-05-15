import { useMutation } from '@apollo/client/react'
import { LOGOUT } from '../../../graphql/session'
import { apolloClient, clearSuperAdminAccessToken } from '../../../lib/apollo'

export function useSuperAdminLogout(onLogout: () => void) {
  const [logoutMutation] = useMutation(LOGOUT)

  async function logout() {
    onLogout()
    clearSuperAdminAccessToken()
    try {
      await logoutMutation()
    } catch (err) {
      void err
    }
    clearSuperAdminAccessToken()
    await apolloClient.clearStore()
  }

  return logout
}
