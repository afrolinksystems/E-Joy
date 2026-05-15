import { AlertCircle } from 'lucide-react'
import { HiddenKitchenReceipt } from '../orders/components/HiddenKitchenReceipt'
import { AddTableButton } from './components/AddTableButton'
import { EditTableDialog } from './components/EditTableDialog'
import { FloorCanvas } from './components/FloorCanvas'
import { FloorLegend } from './components/FloorLegend'
import { FloorToolbar } from './components/FloorToolbar'
import { TableDetailPanel } from './components/TableDetailPanel'
import { TableQRCodeModal } from './components/TableQRCodeModal'
import { useTablesPage } from './hooks/useTablesPage'

export function TableView() {
  const state = useTablesPage()
  const loading =
    (state.tablesLoading || state.ordersLoading) && state.tables.length === 0

  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col gap-4 lg:flex-row">
      <HiddenKitchenReceipt printState={state.printState} />
      <div className="min-w-0 flex-1">
        <FloorToolbar
          isEditMode={state.isEditMode}
          savingLayout={state.mutationState.savingLayout}
          shopId={state.shopId}
          onBeginEdit={state.beginEditLayout}
          onCancelEdit={state.cancelEdit}
          onSaveLayout={() => void state.saveLayout()}
        />
        <FloorLegend isEditMode={state.isEditMode} />
        {state.error ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error.message}
          </div>
        ) : null}
        {state.tableActionError && !state.editTable ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.tableActionError}
            <button
              type="button"
              className="ml-auto text-xs font-semibold underline"
              onClick={() => state.setTableActionError(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <FloorCanvas
          draggingId={state.draggingId}
          floorRef={state.floorRef}
          isEditMode={state.isEditMode}
          loading={loading}
          menuOpenTableId={state.menuOpenTableId}
          mutationState={state.mutationState}
          selected={state.selected}
          tables={state.displayTables}
          onDelete={(table) => void state.confirmDeleteTable(table)}
          onEdit={state.openEditDetails}
          onMenuOpenChange={state.setMenuOpenTableId}
          onPointerDown={state.onTablePointerDown}
          onQr={state.setQrTable}
          onSelect={state.setSelected}
        />
      </div>
      <TableDetailPanel
        ordersForSelectedTable={state.ordersForSelectedTable}
        primaryOrder={state.primaryOrder}
        selected={state.selected}
        onClose={() => state.setSelected(null)}
        onPrintKitchen={state.printState.requestKitchenPrint}
      />
      <EditTableDialog
        capacity={state.form.editFormCapacity}
        error={state.tableActionError}
        number={state.form.editFormNumber}
        table={state.editTable}
        updating={state.mutationState.updatingTable}
        onCapacityChange={state.form.setEditFormCapacity}
        onClose={() => {
          state.setEditTable(null)
          state.setTableActionError(null)
        }}
        onNumberChange={state.form.setEditFormNumber}
        onSave={() => void state.saveEditDetails()}
      />
      <TableQRCodeModal
        open={state.qrTable !== null}
        table={state.qrTable}
        onClose={() => state.setQrTable(null)}
      />
      <AddTableButton
        disabled={
          state.mutationState.creatingTable ||
          state.mutationState.savingLayout ||
          state.mutationState.deletingTable
        }
        loading={state.mutationState.creatingTable}
        onAdd={() => void state.addTable()}
      />
    </div>
  )
}

