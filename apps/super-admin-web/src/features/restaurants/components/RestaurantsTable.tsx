import { Button } from '../../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { EmptyRow } from '../../platform-console/components/EmptyRow'
import { ShopPill } from '../../platform-console/components/ShopPill'
import { formatMoney } from '../../platform-console/platform-console.utils'
import type { ManagedShop } from '../restaurants.types'

type RestaurantsTableProps = {
  onSelect: (shopId: string) => void
  onToggle: (shop: ManagedShop) => void
  selected: string
  shops: ManagedShop[]
}

export function RestaurantsTable({ onSelect, onToggle, selected, shops }: RestaurantsTableProps) {
  return (
    <Table className="min-w-[720px]">
      <TableHeader>
        <TableRow className="bg-muted/50 uppercase text-muted-foreground hover:bg-muted/50">
          <TableHead className="px-4">Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shops.map((shop) => (
          <TableRow key={shop.id} data-state={selected === shop.id ? 'selected' : undefined}>
            <TableCell className="px-4 py-3">
              <Button type="button" variant="link" onClick={() => onSelect(shop.id)} className="h-auto px-0 font-semibold">
                {shop.name}
              </Button>
              <div className="font-mono text-xs text-muted-foreground">{shop.id}</div>
            </TableCell>
            <TableCell><ShopPill status={shop.status} /></TableCell>
            <TableCell>{shop.orderCount}</TableCell>
            <TableCell>{formatMoney(shop.revenueCent)}</TableCell>
            <TableCell className="pr-4 text-right">
              <Button type="button" variant="outline" size="sm" onClick={() => onToggle(shop)}>
                {shop.status === 'ONLINE' ? 'Disable' : 'Enable'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {shops.length === 0 ? <EmptyRow colSpan={5} label="No restaurants found." /> : null}
      </TableBody>
    </Table>
  )
}
