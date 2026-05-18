import type {
  ShopConfigRow,
  ShopThemeOverrides,
} from '../../graphql/shopSettings'
import type {
  ShopSettingsFormState,
  ThemeFieldKey,
  ThemePreset,
  ThemeTokenMap,
} from './shop-settings.types'

export const THEME_PRESETS: Array<{ label: string; value: ThemePreset }> = [
  { label: 'E-Joy Default', value: 'ejoy-default' },
  { label: 'Amber', value: 'amber' },
  { label: 'Light Green', value: 'light-green' },
  { label: 'Mono', value: 'mono' },
]

export const THEME_FIELDS: Array<{ key: ThemeFieldKey; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'primaryForeground', label: 'Primary foreground' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'secondaryForeground', label: 'Secondary foreground' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentForeground', label: 'Accent foreground' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'card', label: 'Card' },
  { key: 'cardForeground', label: 'Card foreground' },
  { key: 'muted', label: 'Muted' },
  { key: 'mutedForeground', label: 'Muted foreground' },
  { key: 'border', label: 'Border' },
  { key: 'ring', label: 'Ring' },
]

export const PRESET_TOKENS: Record<ThemePreset, ThemeTokenMap> = {
  'ejoy-default': {
    primary: '#d29a31',
    primaryForeground: '#ffffff',
    secondary: '#fff5df',
    secondaryForeground: '#6b4a15',
    accent: '#b77f1e',
    accentForeground: '#ffffff',
    background: '#f4f4f4',
    foreground: '#1f1f1f',
    card: '#ffffff',
    cardForeground: '#1f1f1f',
    muted: '#eeeeee',
    mutedForeground: '#767676',
    border: '#e8e3da',
    ring: '#d29a31',
  },
  amber: {
    primary: '#e3b14e',
    primaryForeground: '#000000',
    secondary: '#f2f2f6',
    secondaryForeground: '#7b5a1f',
    accent: '#fdf2d4',
    accentForeground: '#895216',
    background: '#ffffff',
    foreground: '#454545',
    card: '#ffffff',
    cardForeground: '#454545',
    muted: '#faf9fc',
    mutedForeground: '#7c7787',
    border: '#e7e4ec',
    ring: '#e3b14e',
  },
  'light-green': {
    primary: '#7ac943',
    primaryForeground: '#08120a',
    secondary: '#dbe9d2',
    secondaryForeground: '#223127',
    accent: '#dff2d2',
    accentForeground: '#1d2a22',
    background: '#f7fbf4',
    foreground: '#223127',
    card: '#ffffff',
    cardForeground: '#223127',
    muted: '#eef6ea',
    mutedForeground: '#5e6d63',
    border: '#dbe8d5',
    ring: '#7ac943',
  },
  mono: {
    primary: '#666666',
    primaryForeground: '#ffffff',
    secondary: '#f1f1f1',
    secondaryForeground: '#252525',
    accent: '#f1f1f1',
    accentForeground: '#252525',
    background: '#ffffff',
    foreground: '#252525',
    card: '#ffffff',
    cardForeground: '#252525',
    muted: '#f1f1f1',
    mutedForeground: '#6f6f6f',
    border: '#e2e2e2',
    ring: '#8f8f8f',
  },
}

export function emptyThemeOverrides(): Record<ThemeFieldKey, string> {
  return {
    primary: '',
    primaryForeground: '',
    secondary: '',
    secondaryForeground: '',
    accent: '',
    accentForeground: '',
    background: '',
    foreground: '',
    card: '',
    cardForeground: '',
    muted: '',
    mutedForeground: '',
    border: '',
    ring: '',
  }
}

export function emptyShopSettingsForm(): ShopSettingsFormState {
  return {
    name: '',
    description: '',
    contactPhone: '',
    logoUrl: '',
    isOpen: true,
    customerThemePreset: 'ejoy-default',
    customerThemeOverrides: emptyThemeOverrides(),
  }
}

export function isThemePreset(
  value: string | null | undefined,
): value is ThemePreset {
  return (
    value === 'ejoy-default' ||
    value === 'amber' ||
    value === 'light-green' ||
    value === 'mono'
  )
}

export function mapOverridesToForm(
  overrides: ShopThemeOverrides | null | undefined,
): Record<ThemeFieldKey, string> {
  const next = emptyThemeOverrides()
  if (!overrides) return next
  for (const key of Object.keys(next) as ThemeFieldKey[]) {
    next[key] = typeof overrides[key] === 'string' ? overrides[key] ?? '' : ''
  }
  return next
}

export function mapShopToForm(shop: ShopConfigRow): ShopSettingsFormState {
  return {
    name: shop.name,
    description: shop.description ?? '',
    contactPhone: shop.contactPhone ?? '',
    logoUrl: shop.logoUrl ?? '',
    isOpen: shop.active,
    customerThemePreset: isThemePreset(shop.customerThemePreset)
      ? shop.customerThemePreset
      : 'ejoy-default',
    customerThemeOverrides: mapOverridesToForm(shop.customerThemeOverrides),
  }
}

export function serializeOverrides(
  overrides: Record<ThemeFieldKey, string>,
): ShopThemeOverrides | undefined {
  const entries = Object.entries(overrides).flatMap(([key, value]) => {
    const trimmed = value.trim()
    return trimmed ? [[key, trimmed] as const] : []
  })
  if (!entries.length) return undefined
  return Object.fromEntries(entries) as ShopThemeOverrides
}

export function getPreviewTokens(form: ShopSettingsFormState): ThemeTokenMap {
  return {
    ...PRESET_TOKENS[form.customerThemePreset],
    ...Object.fromEntries(
      Object.entries(form.customerThemeOverrides).flatMap(([key, value]) => {
        const trimmed = value.trim()
        return trimmed ? [[key, trimmed] as const] : []
      }),
    ),
  } as ThemeTokenMap
}

export function normalizeColorValue(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#d29a31'
}

