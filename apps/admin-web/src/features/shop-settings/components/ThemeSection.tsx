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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Customer app theme
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Choose a preset, then optionally override the core brand colors used
            in the customer app.
          </p>
        </div>
        <select
          value={form.customerThemePreset}
          onChange={(event) => onPresetChange(event.target.value as ThemePreset)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
        >
          {THEME_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
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
    </section>
  )
}

