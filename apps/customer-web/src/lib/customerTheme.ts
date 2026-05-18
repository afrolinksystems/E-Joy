import type { CSSProperties } from 'react'

export const CUSTOMER_THEME_PRESETS = [
  'ejoy-default',
  'amber',
  'light-green',
  'mono',
] as const

export type CustomerThemePreset = (typeof CUSTOMER_THEME_PRESETS)[number]

export type CustomerThemeInput = {
  primary?: string | null
  primaryForeground?: string | null
  secondary?: string | null
  secondaryForeground?: string | null
  accent?: string | null
  accentForeground?: string | null
  background?: string | null
  foreground?: string | null
  card?: string | null
  cardForeground?: string | null
  muted?: string | null
  mutedForeground?: string | null
  border?: string | null
  ring?: string | null
}

type ThemeStyle = CSSProperties & Record<`--${string}`, string>

export function resolveCustomerThemePreset(
  preset?: string | null,
): CustomerThemePreset {
  return CUSTOMER_THEME_PRESETS.includes(preset as CustomerThemePreset)
    ? (preset as CustomerThemePreset)
    : 'ejoy-default'
}

export function getCustomerThemeVars(theme?: CustomerThemeInput | null): ThemeStyle {
  if (!theme) {
    return {}
  }

  const entries = Object.entries(theme).flatMap(([key, value]) => {
    if (typeof value !== 'string') return []
    const trimmed = value.trim()
    if (!trimmed) return []
    return [[toCssVarName(key), trimmed] as const]
  })

  return Object.fromEntries(entries) as ThemeStyle
}

function toCssVarName(key: string): `--${string}` {
  return `--${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`
}
