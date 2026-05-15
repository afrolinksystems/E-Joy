import { Users } from 'lucide-react'
import type React from 'react'
import type { TableRow } from '../../../graphql/tables'
import { cardClassForStatus } from '../tables.utils'
import { TableCardMenu } from './TableCardMenu'

type TableCardProps = {
  draggingId: string | null
  isEditMode: boolean
  isMenuOpen: boolean
  isSelected: boolean
  menuDisabled: boolean
  table: TableRow
  onDelete: (table: TableRow) => void
  onEdit: (table: TableRow) => void
  onMenuOpenChange: (id: string | null) => void
  onPointerDown: (event: React.PointerEvent, tableId: string) => void
  onQr: (table: TableRow) => void
  onSelect: (table: TableRow) => void
}

export function TableCard({
  draggingId,
  isEditMode,
  isMenuOpen,
  isSelected,
  menuDisabled,
  table,
  onDelete,
  onEdit,
  onMenuOpenChange,
  onPointerDown,
  onQr,
  onSelect,
}: TableCardProps) {
  return (
    <div
      role={isEditMode ? 'presentation' : 'button'}
      tabIndex={isEditMode ? -1 : 0}
      onClick={isEditMode ? undefined : () => onSelect(table)}
      onPointerDown={(event) => onPointerDown(event, table.id)}
      className={[
        'absolute flex min-w-[100px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl px-3 py-3 text-center',
        draggingId === table.id
          ? 'cursor-grabbing scale-[1.02] shadow-xl'
          : isEditMode
            ? 'cursor-grab touch-none'
            : 'cursor-pointer hover:brightness-110',
        draggingId === table.id ? '' : 'transition-all duration-200 ease-out',
        cardClassForStatus(table.status),
        isSelected && !isEditMode
          ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-100'
          : '',
      ].join(' ')}
      style={{ left: `${table.posX * 100}%`, top: `${table.posY * 100}%` }}
    >
      {isEditMode ? (
        <TableCardMenu
          disabled={menuDisabled}
          isOpen={isMenuOpen}
          table={table}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenChange={onMenuOpenChange}
          onQr={onQr}
        />
      ) : null}
      <span className="text-[10px] font-semibold uppercase opacity-90">
        Table
      </span>
      <span className="text-sm font-bold leading-tight">{table.tableNumber}</span>
      <span className="mt-1 flex items-center gap-0.5 text-[10px] opacity-90">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
    </div>
  )
}

