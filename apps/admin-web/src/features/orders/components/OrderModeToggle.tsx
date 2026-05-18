import { LayoutList, MonitorPlay } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'

type OrderModeToggleProps = {
  value: boolean
  onChange: (value: boolean) => void
}

export function OrderModeToggle({ value, onChange }: OrderModeToggleProps) {
  return (
    <ToggleGroup
      value={[value ? 'kitchen' : 'dispatch']}
      onValueChange={(nextValue) => {
        const selected = nextValue.at(-1)
        if (selected) onChange(selected === 'kitchen')
      }}
      className="rounded-lg border bg-muted p-0.5"
    >
      <ToggleGroupItem value="dispatch">
        <LayoutList data-icon="inline-start" />
        Dispatch
      </ToggleGroupItem>
      <ToggleGroupItem value="kitchen">
        <MonitorPlay data-icon="inline-start" />
        Kitchen view
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
