import { Pencil } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { TABLE_POLL_MS } from '../tables.utils'

type FloorToolbarProps = {
  isEditMode: boolean
  savingLayout: boolean
  shopId: string | null
  onBeginEdit: () => void
  onCancelEdit: () => void
  onSaveLayout: () => void
}

export function FloorToolbar({
  isEditMode,
  savingLayout,
  shopId,
  onBeginEdit,
  onCancelEdit,
  onSaveLayout,
}: FloorToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Floor map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shop <span className="font-mono font-semibold text-foreground">{shopId}</span>
          {isEditMode ? (
            <span className="text-primary"> - Edit layout (polling paused)</span>
          ) : (
            <span> - Live sync every {TABLE_POLL_MS / 1000}s</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditMode ? (
          <>
            <Button type="button" onClick={onSaveLayout} disabled={savingLayout}>
              {savingLayout ? 'Saving...' : 'Save layout'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancelEdit} disabled={savingLayout}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onBeginEdit}>
            <Pencil data-icon="inline-start" />
            Edit layout
          </Button>
        )}
      </div>
    </div>
  )
}
