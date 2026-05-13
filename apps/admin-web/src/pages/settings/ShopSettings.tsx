import { useMutation, useQuery } from '@apollo/client/react'
import { Loader2, Store } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  SHOP,
  UPDATE_SHOP,
  type ShopConfigRow,
  type ShopThemeOverrides,
} from '../../graphql/shopSettings'
import { uploadPublicImage } from '../../lib/upload'
import { useAdminSession } from '../../lib/adminSession'

type ThemePreset = 'ejoy-default' | 'light-green' | 'mono'

type FormState = {
  name: string
  description: string
  contactPhone: string
  logoUrl: string
  isOpen: boolean
  customerThemePreset: ThemePreset
  customerThemeOverrides: Record<ThemeFieldKey, string>
}

type ThemeFieldKey =
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

type ThemeTokenMap = Record<ThemeFieldKey, string>

const THEME_PRESETS: Array<{ label: string; value: ThemePreset }> = [
  { label: 'E-Joy Default', value: 'ejoy-default' },
  { label: 'Light Green', value: 'light-green' },
  { label: 'Mono', value: 'mono' },
]

const THEME_FIELDS: Array<{ key: ThemeFieldKey; label: string }> = [
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

const PRESET_TOKENS: Record<ThemePreset, ThemeTokenMap> = {
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

const emptyThemeOverrides = (): Record<ThemeFieldKey, string> => ({
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
})

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  contactPhone: '',
  logoUrl: '',
  isOpen: true,
  customerThemePreset: 'ejoy-default',
  customerThemeOverrides: emptyThemeOverrides(),
})

function mapShopToForm(s: ShopConfigRow): FormState {
  return {
    name: s.name,
    description: s.description ?? '',
    contactPhone: s.contactPhone ?? '',
    logoUrl: s.logoUrl ?? '',
    isOpen: s.active,
    customerThemePreset: isThemePreset(s.customerThemePreset)
      ? s.customerThemePreset
      : 'ejoy-default',
    customerThemeOverrides: mapOverridesToForm(s.customerThemeOverrides),
  }
}

function isThemePreset(value: string | null | undefined): value is ThemePreset {
  return value === 'ejoy-default' || value === 'light-green' || value === 'mono'
}

function mapOverridesToForm(
  overrides: ShopThemeOverrides | null | undefined,
): Record<ThemeFieldKey, string> {
  const next = emptyThemeOverrides()
  if (!overrides) return next
  for (const key of Object.keys(next) as ThemeFieldKey[]) {
    next[key] = typeof overrides[key] === 'string' ? overrides[key] ?? '' : ''
  }
  return next
}

function serializeOverrides(
  overrides: Record<ThemeFieldKey, string>,
): ShopThemeOverrides | undefined {
  const entries = Object.entries(overrides).flatMap(([key, value]) => {
    const trimmed = value.trim()
    return trimmed ? [[key, trimmed] as const] : []
  })
  if (!entries.length) return undefined
  return Object.fromEntries(entries) as ShopThemeOverrides
}

function getPreviewTokens(form: FormState): ThemeTokenMap {
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

function normalizeColorValue(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#d29a31'
}

export function ShopSettings() {
  const { shopId } = useAdminSession()
  const { data, error, refetch } = useQuery<{ shop: ShopConfigRow }>(SHOP, {
    variables: { id: shopId },
    fetchPolicy: 'network-only',
  })

  const [form, setForm] = useState<FormState>(emptyForm)
  const [hydrated, setHydrated] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const previewTokens = useMemo(() => getPreviewTokens(form), [form])

  const [updateShop, { loading: saving }] = useMutation(UPDATE_SHOP, {
    refetchQueries: [{ query: SHOP, variables: { id: shopId } }],
  })

  useEffect(() => {
    const shop = data?.shop
    if (!shop) return
    setForm(mapShopToForm(shop))
    setHydrated(true)
  }, [data])

  useEffect(() => {
    if (error) setHydrated(true)
  }, [error])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const disabled = !hydrated || saving || uploading

  const onPickLogo = async (file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadPublicImage(file)
      setForm((f) => ({ ...f, logoUrl: url }))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || disabled) return
    try {
      await updateShop({
        variables: {
          shopId,
          input: {
            name: form.name.trim(),
            description: form.description.trim(),
            contactPhone: form.contactPhone.trim(),
            logoUrl: form.logoUrl.trim(),
            isOpen: form.isOpen,
            customerThemePreset: form.customerThemePreset,
            customerThemeOverrides: serializeOverrides(form.customerThemeOverrides),
          },
        },
      })
      setToast('Shop settings saved')
      await refetch()
    } catch {
      /* Surface Apollo errors in an extended UI if needed */
    }
  }

  const gqlError = error?.message

  return (
    <div className="relative pb-28">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Shop settings</h2>
          <p className="text-sm text-slate-500">
            Shop{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">{shopId}</code>
          </p>
        </div>
      </div>

      {gqlError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {gqlError}
        </div>
      ) : null}

      <form id="shop-settings-form" onSubmit={onSubmit} className="space-y-6">
        <fieldset disabled={disabled} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
            <p className="mt-1 text-xs text-slate-500">Public-facing name and contact details</p>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Shop name *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Briefly describe your concept, hours, or specialties"
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Contact phone</span>
                <input
                  inputMode="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+251 ..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Branding</h3>
            <p className="mt-1 text-xs text-slate-500">Upload your shop logo; it is stored as a public URL</p>
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                disabled={disabled}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  void onPickLogo(f)
                  e.target.value = ''
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-800 hover:file:bg-orange-100 disabled:opacity-50"
              />
              {uploading ? (
                <p className="mt-2 text-xs text-slate-500">Uploading...</p>
              ) : null}
              {uploadError ? (
                <p className="mt-2 text-xs text-red-600">{uploadError}</p>
              ) : null}
              {form.logoUrl ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}
                    className="text-xs text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
                  >
                    Remove logo
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Customer app theme</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a preset, then optionally override the core brand colors used in the customer app.
                </p>
              </div>
              <select
                value={form.customerThemePreset}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customerThemePreset: e.target.value as ThemePreset,
                  }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
              >
                {THEME_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {THEME_FIELDS.map((field) => {
                const fallback = PRESET_TOKENS[form.customerThemePreset][field.key]
                const currentValue = form.customerThemeOverrides[field.key].trim()

                return (
                  <div key={field.key} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            customerThemeOverrides: {
                              ...f.customerThemeOverrides,
                              [field.key]: '',
                            },
                          }))
                        }
                        className="text-xs text-slate-500 underline hover:text-slate-800"
                      >
                        Use preset
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={normalizeColorValue(currentValue || fallback)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            customerThemeOverrides: {
                              ...f.customerThemeOverrides,
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        className="h-10 w-14 rounded border border-slate-300 bg-white p-1"
                      />
                      <input
                        value={form.customerThemeOverrides[field.key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            customerThemeOverrides: {
                              ...f.customerThemeOverrides,
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        placeholder={fallback}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

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
                    '--popover': previewTokens.card,
                    '--popover-foreground': previewTokens.cardForeground,
                    '--primary': previewTokens.primary,
                    '--primary-foreground': previewTokens.primaryForeground,
                    '--secondary': previewTokens.secondary,
                    '--secondary-foreground': previewTokens.secondaryForeground,
                    '--muted': previewTokens.muted,
                    '--muted-foreground': previewTokens.mutedForeground,
                    '--accent': previewTokens.accent,
                    '--accent-foreground': previewTokens.accentForeground,
                    '--border': previewTokens.border,
                    '--input': previewTokens.border,
                    '--ring': previewTokens.ring,
                  } as CSSProperties
                }
              >
                <div className="bg-[var(--background)] p-4 text-[var(--foreground)]">
                  <div className="rounded-[22px] bg-[var(--card)] p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold">Customer Menu</div>
                        <div className="text-sm text-[var(--muted-foreground)]">{form.name || 'Your restaurant'}</div>
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
                        <button
                          type="button"
                          className="rounded-full px-3 py-1.5 text-xs font-semibold"
                          style={{
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                          }}
                        >
                          Add
                        </button>
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
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Operating status</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {form.isOpen
                    ? 'Open - guests can place orders as usual'
                    : 'Closed - switch carefully; guests may be unable to order'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isOpen}
                aria-label={form.isOpen ? 'Open' : 'Closed'}
                disabled={disabled}
                onClick={() => setForm((f) => ({ ...f, isOpen: !f.isOpen }))}
                className={[
                  'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  form.isOpen ? 'bg-emerald-500' : 'bg-slate-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition',
                    form.isOpen ? 'translate-x-7' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          </section>
        </fieldset>
      </form>

      {!hydrated && !error ? (
        <div className="absolute inset-0 z-30 flex cursor-wait items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-md ring-1 ring-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            Loading shop...
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-56 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button
            type="submit"
            form="shop-settings-form"
            disabled={disabled}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
