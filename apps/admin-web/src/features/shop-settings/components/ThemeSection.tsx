import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type {
  ShopSettingsFormState,
  ThemeFieldKey,
  ThemePreset,
  ThemeTokenMap,
} from '../shop-settings.types'
import { PRESET_TOKENS, THEME_FIELDS, THEME_PRESETS } from '../shop-settings.utils'
import { ThemeFieldControl } from './ThemeFieldControl'
import { ThemePreview } from './ThemePreview'

type ThemeSectionProps = {
  form: ShopSettingsFormState
  previewTokens: ThemeTokenMap
  onPresetChange: (preset: ThemePreset) => void
  onThemeOverrideChange: (key: ThemeFieldKey, value: string) => void
}

export function ThemeSection({
  form,
  previewTokens,
  onPresetChange,
  onThemeOverrideChange,
}: ThemeSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Customer app theme</CardTitle>
        <CardDescription>
          Choose a preset, then optionally override the core brand colors used in the customer app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NativeSelect
          value={form.customerThemePreset}
          onChange={(event) => onPresetChange(event.target.value as ThemePreset)}
          className="w-full sm:w-56"
        >
          {THEME_PRESETS.map((preset) => (
            <NativeSelectOption key={preset.value} value={preset.value}>
              {preset.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {THEME_FIELDS.map((field) => (
            <ThemeFieldControl
              key={field.key}
              fallback={PRESET_TOKENS[form.customerThemePreset][field.key]}
              fieldKey={field.key}
              label={field.label}
              value={form.customerThemeOverrides[field.key]}
              onChange={onThemeOverrideChange}
            />
          ))}
        </div>
        <ThemePreview form={form} previewTokens={previewTokens} />
      </CardContent>
    </Card>
  )
}
