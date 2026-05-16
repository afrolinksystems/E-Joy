import { Card, CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Spinner } from '../../../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '../../../components/ui/table'
import type {
  ProductTableControlActions,
  ProductTableControlState,
  ProductTableViewState,
} from '../products-table.types'
import type { ProductRow } from '../../../graphql/products'
import { ProductTableHeader } from './ProductTableHeader'
import { ProductTablePagination } from './ProductTablePagination'
import { ProductTableRow } from './ProductTableRow'
import { ProductTableToolbar } from './ProductTableToolbar'

type ProductTableProps = {
  actions: ProductTableControlActions
  archiving: boolean
  controls: ProductTableControlState
  loading: boolean
  rows: ProductRow[]
  view: ProductTableViewState
  onArchive: (product: ProductRow) => void
  onEdit: (product: ProductRow) => void
}

export function ProductTable({
  actions,
  archiving,
  controls,
  loading,
  rows,
  view,
  onArchive,
  onEdit,
}: ProductTableProps) {
  return (
    <Card className="flex min-h-0 flex-1 overflow-hidden shadow-sm">
      <ProductTableToolbar actions={actions} controls={controls} view={view} />
      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <Table className="min-w-[860px]">
          <ProductTableHeader sort={controls.sort} onSortChange={actions.setSort} />
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Spinner className="mx-auto size-8 text-primary" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <Empty>
                    <EmptyMedia variant="icon" />
                    <EmptyHeader>
                      <EmptyTitle>No products found</EmptyTitle>
                      <EmptyDescription>Try adjusting the filters or add a new menu item.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((product) => (
                <ProductTableRow
                  key={product.id}
                  archiving={archiving}
                  product={product}
                  onArchive={onArchive}
                  onEdit={onEdit}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <ProductTablePagination actions={actions} controls={controls} view={view} />
    </Card>
  )
}
