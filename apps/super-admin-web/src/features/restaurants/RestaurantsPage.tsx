import { SearchBox } from '../platform-console/components/SearchBox'
import { TableHeader } from '../platform-console/components/TableHeader'
import { RestaurantDetail } from './components/RestaurantDetail'
import { RestaurantsTable } from './components/RestaurantsTable'
import { useRestaurantsPage } from './hooks/useRestaurantsPage'

export function RestaurantsPage() {
  const page = useRestaurantsPage()

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="rounded-xl border border-slate-200 bg-white">
        <TableHeader title="Restaurants" action={<SearchBox value={page.search} onChange={page.setSearch} />} />
        <RestaurantsTable
          shops={page.shops}
          selected={page.selected}
          onSelect={page.setSelectedId}
          onToggle={(shop) => void page.toggleShop(shop)}
        />
      </section>
      {page.selected ? (
        <RestaurantDetail shopId={page.selected} />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Select a restaurant.</section>
      )}
    </div>
  )
}
