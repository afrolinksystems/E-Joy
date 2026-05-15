import { createContext, useContext } from 'react'
import type { AdminSessionContextValue } from '../features/merchant-session/merchant-session.types'

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function useAdminSession(): AdminSessionContextValue {
  const value = useContext(AdminSessionContext)
  if (!value) {
    throw new Error('useAdminSession must be used inside AdminSessionContext')
  }
  return value
}
