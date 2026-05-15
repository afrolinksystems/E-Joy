import { useApolloClient, useSubscription } from '@apollo/client/react'
import type React from 'react'
import {
  GET_TABLES,
  TABLE_STATUS_CHANGED,
  type GetTablesData,
  type TableRow,
  type TableStatusChangedData,
} from '../../../graphql/tables'

type UseTableLiveSyncParams = {
  isEditMode: boolean
  shopId: string | null
  setSelected: React.Dispatch<React.SetStateAction<TableRow | null>>
}

export function useTableLiveSync({
  isEditMode,
  shopId,
  setSelected,
}: UseTableLiveSyncParams) {
  const apolloClient = useApolloClient()

  useSubscription<TableStatusChangedData>(TABLE_STATUS_CHANGED, {
    variables: { shopId },
    skip: isEditMode,
    onData: ({ data: subData }) => {
      const table = subData.data?.tableStatusChanged
      if (!table || table.shopId !== shopId) return
      apolloClient.cache.updateQuery<GetTablesData>(
        { query: GET_TABLES, variables: { shopId } },
        (prev) =>
          prev?.getTables
            ? {
                getTables: prev.getTables.map((row) =>
                  row.id === table.id ? { ...row, ...table } : row,
                ),
              }
            : prev,
      )
      setSelected((prev) =>
        prev?.id === table.id ? { ...prev, ...table } : prev,
      )
    },
  })
}

