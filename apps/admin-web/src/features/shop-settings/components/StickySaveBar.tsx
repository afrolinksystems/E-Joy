import { Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type StickySaveBarProps = {
  disabled: boolean
  saving: boolean
}

export function StickySaveBar({ disabled, saving }: StickySaveBarProps) {
  return (
    <div className="fixed bottom-0 left-56 right-0 z-40 border-t bg-card/95 px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl justify-end">
        <Button
          type="submit"
          form="shop-settings-form"
          disabled={disabled}
          className="h-10 min-w-[140px]"
        >
          {saving ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
