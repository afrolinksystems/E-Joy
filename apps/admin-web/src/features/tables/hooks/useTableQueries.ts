import { useQuery } from '@apollo/client/react'
import { useMemo } from 'react'
import {
  MERCHANT_DISPATCH_ORDERS,
  type MerchantDispatchData,
} from '../../../graphql/merchantOrders'
import {
  GET_TABLES,
  type GetTablesData,
  type TableRow,
} from '../../../graphql/tables'
import { TABLE_POLL_MS } from '../tables.utils'

export function useTableQueries(shopId: string | null, isEditMode: boolean) {
  const tablesQuery = useQuery<GetTablesData>(GET_TABLES, {
    variables: { shopId },
    pollInterval: isEditMode ? undefined : TABLE_POLL_MS,
    fetchPolicy: 'network-only',
  })

  const ordersQuery = useQuery<MerchantDispatchData>(MERCHANT_DISPATCH_ORDERS, {
    variables: { shopId },
    pollInterval: isEditMode ? undefined : TABLE_POLL_MS,
    fetchPolicy: 'network-only',
  })

  const tables = useMemo(
    () => (tablesQuery.data?.getTables ?? []) as TableRow[],
    [tablesQuery.data?.getTables],
  )
  const orders = useMemo(
    () => ordersQuery.data?.merchantDispatchOrders ?? [],
    [ordersQuery.data?.merchantDispatchOrders],
  )

  return { orders, ordersQuery, tables, tablesQuery }
}

