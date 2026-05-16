import { Loader2, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type AddTableButtonProps = {
  disabled: boolean
  loading: boolean
  onAdd: () => void
}

export function AddTableButton({ disabled, loading, onAdd }: AddTableButtonProps) {
  return (
    <Button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      title="Add table at center of map"
      className="fixed bottom-8 right-8 z-30 size-14 rounded-full shadow-lg"
      aria-label="Add table"
      size="icon-lg"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Plus />}
    </Button>
  )
}
