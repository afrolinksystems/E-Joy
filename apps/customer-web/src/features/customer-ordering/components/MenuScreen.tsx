import { ChevronDown, Search, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../../components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../../../components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import type { CartItem } from '../../../store/useCartStore'
import type { MenuItem } from '../customer-ordering.types'
import { categoryCartCount, formatBirr } from '../customer-ordering.utils'
import { MenuSkeleton } from './MenuSkeleton'
import { ProductCard } from './ProductCard'

type MenuScreenProps = {
  cart: CartItem[]
  categories: string[]
  error?: string
  loading: boolean
  menuRows: MenuItem[]
  onAdd: (item: MenuItem) => void
  onOpenCart: () => void
  onOpenDetail: (item: MenuItem) => void
  onOpenInfo: () => void
  onRefetch: () => void
  search: string
  selectedCategory: string
  setSearch: (value: string) => void
  setSelectedCategory: (value: string) => void
  shopName: string
  tableRef: string
  totalPrice: number
  totalQuantity: number
  visibleRows: MenuItem[]
}

export function MenuScreen(props: MenuScreenProps) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const line of props.cart) {
      const item = props.menuRows.find((row) => row.id === line.id)
      if (item?.category) counts.set(item.category, (counts.get(item.category) ?? 0) + line.quantity)
    }
    return counts
  }, [props.cart, props.menuRows])

  return (
    <section className="flex h-svh min-h-svh flex-col overflow-hidden pb-[84px]">
      <header className="sticky top-0 z-20 bg-gradient-to-b from-secondary to-background px-3 pb-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <InputGroup className="h-11 w-[min(72%,300px)] rounded-full border-transparent bg-card/95">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
          />
        </InputGroup>
      </header>

      <Card className="mx-3 mt-3 rounded-b-none shadow-none">
        <CardHeader>
          <CardTitle className="truncate text-[21px] font-black">{props.shopName}</CardTitle>
          <CardDescription>Table {props.tableRef}</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={props.onOpenInfo}>
              View
              <ChevronDown data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-[15px] text-foreground/80">
          Welcome. Order and pay from your phone.
        </CardContent>
      </Card>

      {props.error ? (
        <Alert variant="destructive" className="mx-3 my-2 w-auto">
          <AlertTitle>Menu could not load</AlertTitle>
          <AlertDescription>{props.error}</AlertDescription>
          <AlertAction>
            <Button type="button" variant="ghost" size="sm" onClick={props.onRefetch}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-[96px_minmax(0,1fr)] overflow-hidden bg-card max-[380px]:grid-cols-[84px_minmax(0,1fr)]">
        <aside className="overflow-y-auto bg-muted/75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ToggleGroup
            value={[props.selectedCategory]}
            onValueChange={(value) => {
              const next = value.at(-1)
              if (next) props.setSelectedCategory(next)
            }}
            className="flex w-full flex-col gap-0 rounded-none p-0"
          >
            {props.categories.map((category) => (
              <ToggleGroupItem
                key={category}
                value={category}
                className="relative h-[72px] w-full rounded-none border-l-4 border-transparent px-2 text-center text-[13px] font-bold leading-tight data-[state=on]:border-primary data-[state=on]:bg-card data-[state=on]:text-primary max-[380px]:h-[68px]"
              >
                <span className="line-clamp-2">{category}</span>
                {categoryCartCount(category, categoryCounts, props.totalQuantity) > 0 ? (
                  <Badge className="absolute right-1.5 top-1.5 min-w-5 justify-center px-1 text-[10px]" variant="destructive">
                    {categoryCartCount(category, categoryCounts, props.totalQuantity)}
                  </Badge>
                ) : null}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </aside>

        <div className="min-w-0 overflow-y-auto px-2 pb-28 pt-2 [scrollbar-color:var(--primary)_transparent]">
          {props.loading ? (
            <MenuSkeleton />
          ) : props.visibleRows.length === 0 ? (
            <Empty className="min-h-[260px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No menu items found</EmptyTitle>
                <EmptyDescription>Try another search or category.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {props.visibleRows.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={() => props.onAdd(item)}
                  onOpen={() => props.onOpenDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {props.totalQuantity > 0 ? (
        <Button
          type="button"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] left-[max(12px,calc((100vw-480px)/2+12px))] z-40 h-14 min-w-[236px] max-w-[calc(100vw-24px)] justify-start gap-3 rounded-full bg-card px-2 pr-4 text-primary shadow-xl hover:bg-card"
          onClick={props.onOpenCart}
        >
          <span className="relative grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShoppingCart />
            <Badge className="absolute -right-2 -top-2 min-w-5 justify-center px-1 text-[10px]" variant="destructive">
              {props.totalQuantity}
            </Badge>
          </span>
          <span className="text-[17px] font-black">View cart</span>
          <strong className="ml-auto text-xs text-foreground">{formatBirr(props.totalPrice)}</strong>
        </Button>
      ) : null}
    </section>
  )
}
