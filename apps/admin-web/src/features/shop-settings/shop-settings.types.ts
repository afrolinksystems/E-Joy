export type ThemePreset = 'ejoy-default' | 'amber' | 'light-green' | 'mono'

export type ThemeFieldKey =
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'accent'
  | 'accentForeground'
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'muted'
  | 'mutedForeground'
  | 'border'
  | 'ring'

export type ThemeTokenMap = Record<ThemeFieldKey, string>

export type ShopSettingsFormState = {
  name: string
  description: string
  contactPhone: string
  logoUrl: string
  isOpen: boolean
  customerThemePreset: ThemePreset
  customerThemeOverrides: Record<ThemeFieldKey, string>
}

