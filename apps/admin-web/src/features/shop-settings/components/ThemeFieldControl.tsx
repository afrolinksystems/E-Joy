import { Button } from '../../../components/ui/button'
import { Field, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { ThemeFieldKey } from '../shop-settings.types'
import { normalizeColorValue } from '../shop-settings.utils'

type ThemeFieldControlProps = {
  fallback: string
  fieldKey: ThemeFieldKey
  label: string
  value: string
  onChange: (key: ThemeFieldKey, value: string) => void
}

export function ThemeFieldControl({
  fallback,
  fieldKey,
  label,
  value,
  onChange,
}: ThemeFieldControlProps) {
  const currentValue = value.trim()

  return (
    <Field className="rounded-lg border p-3">
      <FieldLabel htmlFor={`${fieldKey}-theme`}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={normalizeColorValue(currentValue || fallback)}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          className="size-10 w-14 p-1"
          aria-label={`${label} color`}
        />
        <Input
          id={`${fieldKey}-theme`}
          value={value}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder={fallback}
          maxLength={7}
          className="w-[92px] font-mono"
        />
        <Button type="button" variant="link" onClick={() => onChange(fieldKey, '')} className="px-0">
          Use preset
        </Button>
      </div>
    </Field>
  )
}
