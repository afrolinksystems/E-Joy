import { useEffect, useState } from 'react'
import type { TableRow } from '../../../graphql/tables'

export function useTableDetailsForm(editTable: TableRow | null) {
  const [editFormNumber, setEditFormNumber] = useState('')
  const [editFormCapacity, setEditFormCapacity] = useState('')

  useEffect(() => {
    if (!editTable) return
    setEditFormNumber(editTable.tableNumber)
    setEditFormCapacity(String(editTable.capacity))
  }, [editTable])

  return {
    editFormCapacity,
    editFormNumber,
    setEditFormCapacity,
    setEditFormNumber,
  }
}

