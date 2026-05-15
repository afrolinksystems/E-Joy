import { useMutation } from '@apollo/client/react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CREATE_TABLE,
  DELETE_TABLE,
  UPDATE_TABLE,
  UPDATE_TABLE_POSITIONS,
  type TableRow,
  type UpdateTableData,
} from '../../../graphql/tables'
import { useAdminSession } from '../../../lib/adminSession'
import { useKitchenPrint } from '../../printing/hooks/useKitchenPrint'
import type { TablePosition } from '../tables.types'
import { getOpenOrdersForTable, gqlErrorMessage } from '../tables.utils'
import { useTableDetailsForm } from './useTableDetailsForm'
import { useTableDrag } from './useTableDrag'
import { useTableLiveSync } from './useTableLiveSync'
import { useTableQueries } from './useTableQueries'
import { useTableUiEffects } from './useTableUiEffects'

export function useTablesPage() {
  const { shopId } = useAdminSession()
  const floorRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<TableRow | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [localPositions, setLocalPositions] = useState<Record<string, TablePosition>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [menuOpenTableId, setMenuOpenTableId] = useState<string | null>(null)
  const [editTable, setEditTable] = useState<TableRow | null>(null)
  const [tableActionError, setTableActionError] = useState<string | null>(null)
  const [qrTable, setQrTable] = useState<TableRow | null>(null)
  const printState = useKitchenPrint()
  const form = useTableDetailsForm(editTable)

  const dragRef = useTableDrag({
    draggingId,
    floorRef,
    setDraggingId,
    setLocalPositions,
  })

  const { orders, ordersQuery, tables, tablesQuery } = useTableQueries(
    shopId,
    isEditMode,
  )

  useTableLiveSync({ isEditMode, shopId, setSelected })

  const [savePositions, { loading: savingLayout }] = useMutation(
    UPDATE_TABLE_POSITIONS,
  )
  const [createTableMut, { loading: creatingTable }] = useMutation(CREATE_TABLE)
  const [updateTableMut, { loading: updatingTable }] =
    useMutation<UpdateTableData>(UPDATE_TABLE)
  const [deleteTableMut, { loading: deletingTable }] = useMutation(DELETE_TABLE)

  useEffect(() => {
    if (!isEditMode) return
    setLocalPositions((prev) => {
      const next = { ...prev }
      for (const table of tables) {
        next[table.id] ??= { posX: table.posX, posY: table.posY }
      }
      return next
    })
  }, [isEditMode, tables])

  const closeEditTable = useCallback(() => {
    setEditTable(null)
    setTableActionError(null)
  }, [])

  useTableUiEffects({
    editTableOpen: Boolean(editTable),
    menuOpenTableId,
    onCloseEdit: closeEditTable,
    onCloseMenu: () => setMenuOpenTableId(null),
  })

  const displayTables = useMemo(
    () =>
      tables.map((table) => {
        const position = localPositions[table.id]
        return position ? { ...table, ...position } : table
      }),
    [localPositions, tables],
  )

  const ordersForSelectedTable = useMemo(
    () => getOpenOrdersForTable(orders, selected),
    [orders, selected],
  )

  const primaryOrder = ordersForSelectedTable[0] ?? null
  const error = tablesQuery.error ?? ordersQuery.error

  const beginEditLayout = useCallback(() => {
    setLocalPositions(
      Object.fromEntries(
        tables.map((table) => [
          table.id,
          { posX: table.posX, posY: table.posY },
        ]),
      ),
    )
    setIsEditMode(true)
  }, [tables])

  const cancelEdit = useCallback(() => {
    setIsEditMode(false)
    setLocalPositions({})
    setDraggingId(null)
    dragRef.current = null
    setMenuOpenTableId(null)
    void tablesQuery.refetch()
  }, [dragRef, tablesQuery])

  const saveLayout = useCallback(async () => {
    if (!displayTables.length) {
      setIsEditMode(false)
      setLocalPositions({})
      return
    }
    await savePositions({
      variables: {
        shopId,
        input: displayTables.map((table) => ({
          id: table.id,
          posX: table.posX,
          posY: table.posY,
        })),
      },
    })
    setIsEditMode(false)
    setLocalPositions({})
    await tablesQuery.refetch()
  }, [displayTables, savePositions, shopId, tablesQuery])

  const addTable = useCallback(async () => {
    await createTableMut({ variables: { shopId } })
    await tablesQuery.refetch()
    await ordersQuery.refetch()
  }, [createTableMut, ordersQuery, shopId, tablesQuery])

  const openEditDetails = useCallback((table: TableRow) => {
    setMenuOpenTableId(null)
    setTableActionError(null)
    setEditTable(table)
  }, [])

  const saveEditDetails = useCallback(async () => {
    if (!editTable) return

    const capacity = parseInt(form.editFormCapacity, 10)
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 99) {
      setTableActionError('Capacity must be an integer from 1 to 99.')
      return
    }

    const tableNumber = form.editFormNumber.trim()
    if (!tableNumber) {
      setTableActionError('Table number is required.')
      return
    }

    setTableActionError(null)
    try {
      const { data } = await updateTableMut({
        variables: { id: editTable.id, tableNumber, capacity, shopId },
      })
      setEditTable(null)
      await tablesQuery.refetch()
      await ordersQuery.refetch()
      const updated = data?.updateTable
      if (updated && selected?.id === updated.id) setSelected(updated)
    } catch (err: unknown) {
      setTableActionError(gqlErrorMessage(err))
    }
  }, [editTable, form, ordersQuery, selected, shopId, tablesQuery, updateTableMut])

  const confirmDeleteTable = useCallback(
    async (table: TableRow) => {
      if (!window.confirm('Are you sure you want to remove this table?')) return
      setMenuOpenTableId(null)
      setTableActionError(null)
      try {
        await deleteTableMut({ variables: { id: table.id, shopId } })
        setLocalPositions((prev) => {
          const next = { ...prev }
          delete next[table.id]
          return next
        })
        if (selected?.id === table.id) setSelected(null)
        await tablesQuery.refetch()
        await ordersQuery.refetch()
      } catch (err: unknown) {
        setTableActionError(gqlErrorMessage(err))
      }
    },
    [deleteTableMut, ordersQuery, selected, shopId, tablesQuery],
  )

  const onTablePointerDown = useCallback(
    (event: React.PointerEvent, tableId: string) => {
      if (!isEditMode || !floorRef.current) return
      if ((event.target as HTMLElement).closest('[data-table-card-menu]')) return

      event.preventDefault()
      event.stopPropagation()
      const table = tables.find((row) => row.id === tableId)
      if (!table) return

      const position = localPositions[tableId] ?? {
        posX: table.posX,
        posY: table.posY,
      }
      dragRef.current = {
        id: tableId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: position.posX,
        originY: position.posY,
      }
      setDraggingId(tableId)
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    },
    [dragRef, isEditMode, localPositions, tables],
  )

  return {
    addTable,
    beginEditLayout,
    cancelEdit,
    confirmDeleteTable,
    displayTables,
    draggingId,
    editTable,
    error,
    floorRef,
    form,
    isEditMode,
    menuOpenTableId,
    mutationState: {
      creatingTable,
      deletingTable,
      savingLayout,
      updatingTable,
    },
    onTablePointerDown,
    openEditDetails,
    ordersForSelectedTable,
    primaryOrder,
    printState,
    qrTable,
    saveEditDetails,
    saveLayout,
    selected,
    setEditTable,
    setMenuOpenTableId,
    setQrTable,
    setSelected,
    setTableActionError,
    shopId,
    tableActionError,
    tables,
    tablesLoading: tablesQuery.loading,
    ordersLoading: ordersQuery.loading,
  }
}
