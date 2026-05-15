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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-4 py-3">Name</th><th>Status</th><th>Orders</th><th>Revenue</th><th className="pr-4 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shops.map((shop) => (
            <tr key={shop.id} className={selected === shop.id ? 'bg-blue-50/60' : ''}>
              <td className="px-4 py-3">
                <button onClick={() => onSelect(shop.id)} className="font-semibold text-blue-700">{shop.name}</button>
                <div className="font-mono text-xs text-slate-500">{shop.id}</div>
              </td>
              <td><ShopPill status={shop.status} /></td>
              <td>{shop.orderCount}</td>
              <td>{formatMoney(shop.revenueCent)}</td>
              <td className="pr-4 text-right">
                <button onClick={() => onToggle(shop)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">{shop.status === 'ONLINE' ? 'Disable' : 'Enable'}</button>
              </td>
            </tr>
          ))}
          {shops.length === 0 ? <EmptyRow colSpan={5} label="No restaurants found." /> : null}
        </tbody>
      </table>
    </div>
  )
}
