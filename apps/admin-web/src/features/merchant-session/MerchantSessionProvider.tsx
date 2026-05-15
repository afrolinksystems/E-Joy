import type { ReactNode } from 'react'
import { AdminSessionContext } from '../../lib/adminSession'
import type { MerchantSession } from './merchant-session.types'

type MerchantSessionProviderProps = {
  children: ReactNode
  logout: () => void
  session: MerchantSession
}

export function MerchantSessionProvider({ children, logout, session }: MerchantSessionProviderProps) {
  return (
    <AdminSessionContext.Provider value={{ session, shopId: session.shopId, logout }}>
      {children}
    </AdminSessionContext.Provider>
  )
}
