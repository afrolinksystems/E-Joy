import { Plus } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import type { MenuItem } from '../customer-ordering.types'
import { formatBirr, resolveProductImageUrl } from '../customer-ordering.utils'

type ProductCardProps = {
  item: MenuItem
  onAdd: () => void
  onOpen: () => void
}

export function ProductCard({ item, onAdd, onOpen }: ProductCardProps) {
  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="grid min-h-[142px] grid-cols-[106px_minmax(0,1fr)] gap-3 p-2 max-[380px]:grid-cols-[88px_minmax(0,1fr)]">
        <button
          type="button"
          className="size-[106px] overflow-hidden rounded-lg bg-muted max-[380px]:size-[88px]"
          onClick={onOpen}
          aria-label={`View ${item.name}`}
        >
          <img src={resolveProductImageUrl(item.imageUrl)} alt="" className="size-full object-cover" />
        </button>
        <div className="flex min-w-0 flex-col items-start">
          <button
            type="button"
            className="line-clamp-2 min-h-10 text-left text-[17px] font-black leading-tight text-foreground max-[380px]:text-[16px]"
            onClick={onOpen}
          >
            {item.name}
          </button>
          <Badge variant="secondary" className="mt-2">Member price</Badge>
          <div className="mt-auto flex w-full items-center justify-between gap-2">
            <strong className="text-[18px] font-black">{formatBirr(item.unitPrice)}</strong>
            <Button type="button" size="icon-lg" className="rounded-full" onClick={onAdd} aria-label={`Add ${item.name}`}>
              <Plus />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
