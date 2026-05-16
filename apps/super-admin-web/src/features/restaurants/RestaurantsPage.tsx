import { Card } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SearchBox } from '../platform-console/components/SearchBox'
import { TableHeader } from '../platform-console/components/TableHeader'
import { RestaurantDetail } from './components/RestaurantDetail'
import { RestaurantsTable } from './components/RestaurantsTable'
import { useRestaurantsPage } from './hooks/useRestaurantsPage'

export function RestaurantsPage() {
  const page = useRestaurantsPage()

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <Card>
        <TableHeader title="Restaurants" action={<SearchBox value={page.search} onChange={page.setSearch} />} />
        <RestaurantsTable
          shops={page.shops}
          selected={page.selected}
          onSelect={page.setSelectedId}
          onToggle={(shop) => void page.toggleShop(shop)}
        />
      </Card>
      {page.selected ? (
        <RestaurantDetail shopId={page.selected} />
      ) : (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Select a restaurant.</EmptyTitle>
              <EmptyDescription>Choose a row to inspect settings, managers, and payments.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}
    </div>
  )
}
