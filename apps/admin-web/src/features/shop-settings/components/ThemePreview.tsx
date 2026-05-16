import type { CSSProperties } from 'react'
import type {
  ShopSettingsFormState,
  ThemeTokenMap,
} from '../shop-settings.types'

type ThemePreviewProps = {
  form: ShopSettingsFormState
  previewTokens: ThemeTokenMap
}

export function ThemePreview({ form, previewTokens }: ThemePreviewProps) {
  return (
    <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        Preview
      </p>
      <div
        className="mx-auto max-w-[360px] overflow-hidden rounded-[28px] border border-[var(--border)] shadow-sm"
        style={
          {
            '--background': previewTokens.background,
            '--foreground': previewTokens.foreground,
            '--card': previewTokens.card,
            '--card-foreground': previewTokens.cardForeground,
            '--primary': previewTokens.primary,
            '--primary-foreground': previewTokens.primaryForeground,
            '--secondary': previewTokens.secondary,
            '--secondary-foreground': previewTokens.secondaryForeground,
            '--muted': previewTokens.muted,
            '--muted-foreground': previewTokens.mutedForeground,
            '--accent': previewTokens.accent,
            '--accent-foreground': previewTokens.accentForeground,
            '--border': previewTokens.border,
          } as CSSProperties
        }
      >
        <div className="bg-[var(--background)] p-4 text-[var(--foreground)]">
          <div className="rounded-[22px] bg-[var(--card)] p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Customer Menu</div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {form.name || 'Your restaurant'}
                </div>
              </div>
              <div
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                }}
              >
                Table view
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="text-sm font-medium">Signature Tibs</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                Sample menu card preview
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-semibold">260 ETB</div>
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  Add
                </span>
              </div>
            </div>
            <div
              className="mt-4 rounded-2xl border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--accent)',
                color: 'var(--accent-foreground)',
              }}
            >
              Theme preview follows the selected preset and shop overrides.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
