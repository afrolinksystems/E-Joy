import { useMutation, useQuery } from '@apollo/client/react'
import { useState } from 'react'
import { SHOPS, UPDATE_SHOP } from '../../../graphql/restaurants'
import type { ManagedShop } from '../restaurants.types'

export function useRestaurantsPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const shopsQuery = useQuery<{ managedShops: ManagedShop[] }>(SHOPS, {
    variables: { filter: { search: search || null } },
  })
  const [updateShop] = useMutation(UPDATE_SHOP)
  const shops = shopsQuery.data?.managedShops ?? []
  const selected = selectedId || shops[0]?.id || ''

  async function toggleShop(shop: ManagedShop) {
    await updateShop({ variables: { shopId: shop.id, input: { online: shop.status !== 'ONLINE' } } })
    await shopsQuery.refetch()
  }

  return {
    search,
    selected,
    setSearch,
    setSelectedId,
    shops,
    toggleShop,
  }
}
