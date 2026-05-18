import type { MerchantMeData } from '../../graphql/auth'

export type MerchantSession = MerchantMeData['merchantMe']

export type AdminSessionContextValue = {
  logout: () => void
  session: MerchantSession
  shopId: string
}
