import { useAdminSession } from '../../../lib/adminSession'

export function useMerchantLogout() {
  return useAdminSession().logout
}
