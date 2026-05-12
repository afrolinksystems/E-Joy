import { createContext, useContext } from 'react'
import type { MerchantMeData } from '../graphql/auth'

export const ADMIN_TOKEN_STORAGE_KEY = 'ejoy_admin_access_token'

export type MerchantSession = MerchantMeData['merchantMe']

export type AdminSessionContextValue = {
  session: MerchantSession
  shopId: string
  logout: () => void
}

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function useAdminSession(): AdminSessionContextValue {
  const value = useContext(AdminSessionContext)
  if (!value) {
    throw new Error('useAdminSession must be used inside AdminSessionContext')
  }
  return value
}
