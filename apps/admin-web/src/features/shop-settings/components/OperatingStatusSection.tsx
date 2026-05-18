import type React from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Switch } from '../../../components/ui/switch'
import type { ShopSettingsFormState } from '../shop-settings.types'

type OperatingStatusSectionProps = {
  disabled: boolean
  form: ShopSettingsFormState
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
}

export function OperatingStatusSection({
  disabled,
  form,
  onFormChange,
}: OperatingStatusSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Operating status</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {form.isOpen
              ? 'Open - guests can place orders as usual'
              : 'Closed - switch carefully; guests may be unable to order'}
          </p>
        </div>
        <Switch
          checked={form.isOpen}
          aria-label={form.isOpen ? 'Open' : 'Closed'}
          disabled={disabled}
          onCheckedChange={() =>
            onFormChange((current) => ({ ...current, isOpen: !current.isOpen }))
          }
        />
      </CardContent>
    </Card>
  )
}
