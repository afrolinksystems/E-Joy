import { Loader2, MapPin } from 'lucide-react'
import type React from 'react'
import type { TableRow } from '../../../graphql/tables'
import type { TableMutationState } from '../tables.types'
import { TableCard } from './TableCard'

type FloorCanvasProps = {
  draggingId: string | null
  floorRef: React.RefObject<HTMLDivElement | null>
  isEditMode: boolean
  loading: boolean
  menuOpenTableId: string | null
  mutationState: TableMutationState
  selected: TableRow | null
  tables: TableRow[]
  onDelete: (table: TableRow) => void
  onEdit: (table: TableRow) => void
  onMenuOpenChange: (id: string | null) => void
  onPointerDown: (event: React.PointerEvent, tableId: string) => void
  onQr: (table: TableRow) => void
  onSelect: (table: TableRow) => void
}

export function FloorCanvas({
  draggingId,
  floorRef,
  isEditMode,
  loading,
  menuOpenTableId,
  mutationState,
  selected,
  tables,
  onDelete,
  onEdit,
  onMenuOpenChange,
  onPointerDown,
  onQr,
  onSelect,
}: FloorCanvasProps) {
  const menuDisabled =
    mutationState.savingLayout ||
    mutationState.deletingTable ||
    mutationState.updatingTable

  return (
    <div
      ref={floorRef}
      className="relative min-h-[560px] w-full overflow-hidden rounded-3xl bg-gray-100 p-4 shadow-inner"
      style={
        isEditMode
          ? {
              backgroundImage: `
                linear-gradient(to right, rgb(209 213 219 / 0.65) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(209 213 219 / 0.65) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }
          : undefined
      }
    >
      {loading && tables.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading floor…
        </div>
      ) : tables.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
          <p>No tables yet. Add a table with the button below.</p>
        </div>
      ) : (
        tables.map((table) => (
          <TableCard
            key={table.id}
            draggingId={draggingId}
            isEditMode={isEditMode}
            isMenuOpen={menuOpenTableId === table.id}
            isSelected={selected?.id === table.id}
            menuDisabled={menuDisabled}
            table={table}
            onDelete={onDelete}
            onEdit={onEdit}
            onMenuOpenChange={onMenuOpenChange}
            onPointerDown={onPointerDown}
            onQr={onQr}
            onSelect={onSelect}
          />
        ))
      )}
      <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-xs text-slate-400">
        <MapPin className="h-3.5 w-3.5" />
        {isEditMode
          ? 'Drag to reposition · Save when done'
          : 'Tap a table for live order details'}
      </div>
    </div>
  )
}

