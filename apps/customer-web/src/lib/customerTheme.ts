import type { CSSProperties } from 'react'

export type CustomerThemeInput = {
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  accent?: string
  accentForeground?: string
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  muted?: string
  mutedForeground?: string
  border?: string
  ring?: string
  logoUrl?: string | null
}

const EJOY_THEME: Required<Omit<CustomerThemeInput, 'logoUrl'>> = {
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
}

type ThemeStyle = CSSProperties & Record<`--${string}`, string>

export function getCustomerThemeVars(theme?: CustomerThemeInput): ThemeStyle {
  const merged = { ...EJOY_THEME, ...theme }

  return {
    '--background': merged.background,
    '--foreground': merged.foreground,
    '--card': merged.card,
    '--card-foreground': merged.cardForeground,
    '--popover': merged.card,
    '--popover-foreground': merged.cardForeground,
    '--primary': merged.primary,
    '--primary-foreground': merged.primaryForeground,
    '--secondary': merged.secondary,
    '--secondary-foreground': merged.secondaryForeground,
    '--muted': merged.muted,
    '--muted-foreground': merged.mutedForeground,
    '--accent': merged.accent,
    '--accent-foreground': merged.accentForeground,
    '--border': merged.border,
    '--input': merged.border,
    '--ring': merged.ring,
    '--radius': '0.875rem',
  }
}

export const defaultCustomerTheme = EJOY_THEME
