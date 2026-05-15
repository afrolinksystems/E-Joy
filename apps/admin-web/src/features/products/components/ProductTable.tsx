import { Loader2, Pencil, Trash2 } from 'lucide-react'
import type { ProductRow } from '../../../graphql/products'
import { centsToBirrDisplay } from '../../../lib/price'

type ProductTableProps = {
  archiving: boolean
  loading: boolean
  rows: ProductRow[]
  onArchive: (product: ProductRow) => void
  onEdit: (product: ProductRow) => void
}

export function ProductTable({
  archiving,
  loading,
  rows,
  onArchive,
  onEdit,
}: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-16 px-4 py-3">Img</th>
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
              rows.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-2">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-800">
                    {centsToBirrDisplay(product.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        product.active
                          ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'
                          : 'inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600'
                      }
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={archiving}
                        onClick={() => onArchive(product)}
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
  )
}

