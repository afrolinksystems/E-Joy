type FloorLegendProps = {
  isEditMode: boolean
}

export function FloorLegend({ isEditMode }: FloorLegendProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-emerald-500" />
        Available
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-orange-500" />
        Active order
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-slate-500" />
        Dirty
      </span>
      {isEditMode ? (
        <span className="text-slate-500">Drag tables · Snap 2% grid</span>
      ) : null}
    </div>
  )
}

