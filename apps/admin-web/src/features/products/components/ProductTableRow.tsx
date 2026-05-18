import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { TableCell, TableRow } from '../../../components/ui/table'
import type { ProductRow } from '../../../graphql/products'
import { centsToBirrDisplay } from '../../../lib/price'

type ProductTableRowProps = {
  archiving: boolean
  product: ProductRow
  onArchive: (product: ProductRow) => void
  onEdit: (product: ProductRow) => void
}

export function ProductTableRow({
  archiving,
  product,
  onArchive,
  onEdit,
}: ProductTableRowProps) {
  return (
    <TableRow>
      <TableCell className="px-4 py-1.5">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="size-10 rounded-md object-cover ring-1 ring-border"
          />
        ) : (
          <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            -
          </span>
        )}
      </TableCell>
      <TableCell className="px-4 py-2">
        <span className="block max-w-[26rem] truncate text-sm font-semibold">{product.name}</span>
      </TableCell>
      <TableCell className="px-4 py-2 text-sm text-muted-foreground">
        <span className="inline-flex max-w-64 truncate">{product.category}</span>
      </TableCell>
      <TableCell className="px-4 py-2 text-right text-sm tabular-nums">
        {centsToBirrDisplay(product.unitPrice)}
      </TableCell>
      <TableCell className="px-4 py-2 text-center">
        <Badge variant={product.active ? 'default' : 'secondary'}>
          {product.active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-2 text-right">
        <div className="inline-flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(product)} title="Edit">
            <Pencil data-icon="inline-start" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={archiving}
            onClick={() => onArchive(product)}
            title="Remove from active menu"
          >
            <Trash2 data-icon="inline-start" aria-hidden />
            Archive
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
