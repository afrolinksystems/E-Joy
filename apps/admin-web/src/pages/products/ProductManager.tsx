import { useMutation, useQuery } from '@apollo/client/react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ARCHIVE_PRODUCT,
  CREATE_PRODUCT,
  PRODUCTS,
  UPDATE_PRODUCT,
  type ProductRow,
} from '../../graphql/products'
import { birrInputToCents, centsToBirrDisplay } from '../../lib/price'
import { uploadPublicImage } from '../../lib/upload'
import { useAdminSession } from '../../lib/adminSession'

type FormState = {
  name: string
  category: string
  priceBirr: string
  imageUrl: string
  active: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  category: '',
  priceBirr: '',
  imageUrl: '',
  active: true,
})

function graphqlErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'graphQLErrors' in err) {
    const ge = (err as { graphQLErrors?: readonly { message?: string }[] })
      .graphQLErrors
    if (ge?.length) {
      return ge.map((e) => e.message ?? '').join(' ').trim()
    }
  }
  if (err instanceof Error) return err.message
  return String(err)
}

function formatSubmitError(err: unknown): string | null {
  const msg = graphqlErrorMessage(err)
  const lower = msg.toLowerCase()
  if (
    lower.includes('already exists') ||
    lower.includes('conflict') ||
    lower.includes('duplicate')
  ) {
    return 'A product with this name already exists!'
  }
  return msg || null
}

export function ProductManager() {
  const { shopId } = useAdminSession()
  const { data, loading, error, refetch } = useQuery<{
    products: ProductRow[]
  }>(PRODUCTS, {
    variables: { shopId, category: undefined },
    fetchPolicy: 'network-only',
  })

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT)
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT)
  const [archiveProduct, { loading: archiving }] = useMutation(ARCHIVE_PRODUCT)

  const rows = data?.products ?? []

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ variant: 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  const title = editing ? 'Edit item' : 'Add item'

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setUploadError(null)
    setToast(null)
    setModalOpen(true)
  }

  const openEdit = (p: ProductRow) => {
    setEditing(p)
    setForm({
      name: p.name,
      category: p.category,
      priceBirr: centsToBirrDisplay(p.unitPrice),
      imageUrl: p.imageUrl ?? '',
      active: p.active,
    })
    setUploadError(null)
    setToast(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm())
    setUploadError(null)
    setToast(null)
  }

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadPublicImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const saving = creating || updating

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const unitPriceCents = birrInputToCents(form.priceBirr) // Birr → cents, same as Math.round(Number(price) * 100)
    if (!form.name.trim() || !form.category.trim()) return

    setToast(null)
    try {
      const imageUrl = form.imageUrl.trim()
      if (editing) {
        await updateProduct({
          variables: {
            productId: editing.id,
            shopId,
            input: {
              name: form.name.trim(),
              category: form.category.trim(),
              unitPrice: unitPriceCents,
              imageUrl,
              active: form.active,
            },
          },
        })
      } else {
        await createProduct({
          variables: {
            shopId,
            input: {
              name: form.name.trim(),
              category: form.category.trim(),
              unitPrice: unitPriceCents,
              ...(imageUrl ? { imageUrl } : {}),
              active: form.active,
            },
          },
        })
      }
      await refetch()
      closeModal()
    } catch (err) {
      const msg = formatSubmitError(err)
      setToast({
        variant: 'error',
        message: msg ?? 'Could not save. Please try again.',
      })
    }
  }

  const onArchiveClick = (p: ProductRow) => {
    const ok = window.confirm(
      'Are you sure you want to remove this item from the active menu?',
    )
    if (!ok) return
    void (async () => {
      setToast(null)
      try {
        await archiveProduct({
          variables: { productId: p.id, shopId },
        })
        await refetch()
      } catch (err) {
        const raw = graphqlErrorMessage(err)
        setToast({
          variant: 'error',
          message: raw.trim() ? raw : 'Could not archive this item.',
        })
      }
    })()
  }

  const gqlError = error?.message
  console.error(error, "=====", gqlError)
  console.log('gqlError', gqlError)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Menu items</h2>
          <p className="text-sm text-slate-500">
            Shop <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">{shopId}</code> ·
            Enter price in Birr; it is stored as cents on save
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      {toast ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-sm"
        >
          {toast.message}
        </div>
      ) : null}

      {gqlError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {gqlError}. Ensure order-service is running and{' '}
          <code className="rounded bg-red-100 px-1">VITE_ADMIN_BEARER_TOKEN</code>{' '}
          is an admin JWT with <code className="rounded bg-red-100 px-1">staff:read</code>.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 w-16">Img</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price (Birr)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No menu items yet
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-2">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-800">
                      {centsToBirrDisplay(p.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          p.active
                            ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'
                            : 'inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600'
                        }
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={archiving}
                          onClick={() => onArchiveClick(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
                          title="Remove from active menu"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <input
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Price (Birr)</span>
                <input
                  required
                  inputMode="decimal"
                  value={form.priceBirr}
                  onChange={(e) => setForm((f) => ({ ...f, priceBirr: e.target.value }))}
                  placeholder="e.g. 380.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums outline-none ring-orange-500 focus:border-orange-500 focus:ring-2"
                />
              </label>
              <div className="block">
                <span className="text-sm font-medium text-slate-700">Item image</span>
                <div className="mt-1 flex flex-wrap items-start gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      void handleFileUpload(f)
                      e.target.value = ''
                    }}
                    className="min-w-0 flex-1 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-800 hover:file:bg-orange-100"
                  />
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : null}
                </div>
                {uploading ? (
                  <p className="mt-1 text-xs text-slate-500">Uploading…</p>
                ) : null}
                {uploadError ? (
                  <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                ) : null}
                {form.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    className="mt-2 text-xs text-slate-600 underline hover:text-slate-900"
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Active (on menu)</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
