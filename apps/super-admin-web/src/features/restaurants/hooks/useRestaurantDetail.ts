import { useMutation, useQuery } from '@apollo/client/react'
import { SHOP_DETAIL, UPDATE_PAYMENT } from '../../../graphql/restaurants'
import type { ManagedShopDetail, PaymentConfigFormState } from '../restaurants.types'

export function useRestaurantDetail(shopId: string) {
  const detail = useQuery<{ managedShop: ManagedShopDetail }>(SHOP_DETAIL, { variables: { shopId } })
  const [savePayment] = useMutation(UPDATE_PAYMENT)

  async function save(payment: PaymentConfigFormState) {
    await savePayment({ variables: { shopId, input: payment } })
    await detail.refetch()
  }

  return {
    data: detail.data?.managedShop,
    loading: detail.loading,
    save,
  }
}
