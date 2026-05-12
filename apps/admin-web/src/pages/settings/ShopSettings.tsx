import { useMutation, useQuery } from '@apollo/client/react'
import { Loader2, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SHOP, UPDATE_SHOP, type ShopConfigRow } from '../../graphql/shopSettings'
import { uploadPublicImage } from '../../lib/upload'
import { useAdminSession } from '../../lib/adminSession'

type FormState = {
  name: string
  description: string
  contactPhone: string
  logoUrl: string
  isOpen: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  contactPhone: '',
  logoUrl: '',
  isOpen: true,
})

function mapShopToForm(s: ShopConfigRow): FormState {
  return {
    name: s.name,
    description: s.description ?? '',
    contactPhone: s.contactPhone ?? '',
    logoUrl: s.logoUrl ?? '',
    isOpen: s.active,
  }
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
          {/* Basic info */}
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
                  placeholder="+251 …"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2 disabled:bg-slate-50"
                />
              </label>
            </div>
          </section>

          {/* Branding */}
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
                <p className="mt-2 text-xs text-slate-500">Uploading…</p>
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

          {/* Open / closed */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Operating status</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {form.isOpen
                    ? 'Open — guests can place orders as usual'
                    : 'Closed — switch carefully; guests may be unable to order'}
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
            Loading shop…
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
