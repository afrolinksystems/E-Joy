import { Loader2, Plus } from 'lucide-react'

type AddTableButtonProps = {
  disabled: boolean
  loading: boolean
  onAdd: () => void
}

export function AddTableButton({ disabled, loading, onAdd }: AddTableButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      title="Add table at center of map"
      className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
      aria-label="Add table"
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Plus className="h-7 w-7" />
      )}
    </button>
  )
}

