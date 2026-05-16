import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Spinner } from '../../../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
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
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/50 uppercase tracking-wide text-muted-foreground hover:bg-muted/50">
              <TableHead className="w-16 px-4">Img</TableHead>
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Category</TableHead>
              <TableHead className="px-4 text-right">Price (Birr)</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Spinner className="mx-auto size-8 text-primary" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No menu items yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-4 py-2">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="size-10 rounded-md object-cover ring-1 ring-border"
                      />
                    ) : (
                      <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {product.category}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm tabular-nums">
                    {centsToBirrDisplay(product.unitPrice)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
