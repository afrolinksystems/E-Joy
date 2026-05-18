import { MoreVertical } from 'lucide-react'
import type { TableRow } from '../../../graphql/tables'

type TableCardMenuProps = {
  disabled: boolean
  isOpen: boolean
  table: TableRow
  onDelete: (table: TableRow) => void
  onEdit: (table: TableRow) => void
  onOpenChange: (id: string | null) => void
  onQr: (table: TableRow) => void
}

export function TableCardMenu({
  disabled,
  isOpen,
  table,
  onDelete,
  onEdit,
  onOpenChange,
  onQr,
}: TableCardMenuProps) {
  return (
    <div
      className="absolute -right-1 -top-1 z-20"
      data-table-card-menu
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Table actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          onOpenChange(isOpen ? null : table.id)
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white shadow hover:bg-black/40 disabled:opacity-50"
        title="Settings"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 top-full z-30 mt-1 min-w-[168px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
          data-table-card-menu
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(table)
            }}
          >
            Edit Details
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation()
              onOpenChange(null)
              onQr(table)
            }}
          >
            Show QR Code
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(table)
            }}
          >
            Delete Table
          </button>
        </div>
      ) : null}
    </div>
  )
}

