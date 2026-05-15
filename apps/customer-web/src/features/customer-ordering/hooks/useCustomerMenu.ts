import { useQuery } from '@apollo/client/react'
import { useEffect, useMemo } from 'react'
import { CUSTOMER_SHOP, type CustomerShopRow } from '../../../graphql/customerShop'
import { SHOP_MENU } from '../../../graphql/shopMenu'
import {
  getCustomerThemeVars,
  resolveCustomerThemePreset,
} from '../../../lib/customerTheme'
import type { MenuItem } from '../customer-ordering.types'

type UseCustomerMenuParams = {
  hasTableSession: boolean
  search: string
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  shopId: string
}

export function useCustomerMenu({
  hasTableSession,
  search,
  selectedCategory,
  setSelectedCategory,
  shopId,
}: UseCustomerMenuParams) {
  const menuQuery = useQuery<{ shopMenu: MenuItem[] }>(SHOP_MENU, {
    variables: { shopId },
    skip: !hasTableSession,
    fetchPolicy: 'cache-and-network',
  })

  const shopQuery = useQuery<{ customerShop: CustomerShopRow | null }>(
    CUSTOMER_SHOP,
    {
      variables: { shopId },
      skip: !hasTableSession,
      fetchPolicy: 'cache-and-network',
    },
  )

  const menuRows = useMemo(
    () => menuQuery.data?.shopMenu ?? [],
    [menuQuery.data?.shopMenu],
  )

  const categories = useMemo(() => {
    const values = menuRows.map((row) => row.category || 'Menu')
    return ['All', ...Array.from(new Set(values))]
  }, [menuRows])

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return menuRows.filter((row) => {
      const inCategory =
        selectedCategory === 'All' || row.category === selectedCategory
      const inSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query)
      return inCategory && inSearch
    })
  }, [menuRows, search, selectedCategory])

  useEffect(() => {
    if (selectedCategory === 'All') return
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory, setSelectedCategory])

  const shop = shopQuery.data?.customerShop ?? null

  return {
    categories,
    customerThemePreset: resolveCustomerThemePreset(shop?.customerThemePreset),
    customerThemeVars: getCustomerThemeVars(shop?.customerThemeOverrides),
    error: menuQuery.error,
    loading: menuQuery.loading,
    menuRows,
    refetch: menuQuery.refetch,
    shopName: shop?.name?.trim() || 'E-Joy Restaurant',
    visibleRows,
  }
}
