import { Separator } from '../../../components/ui/separator'
import type { OrderDetailData } from '../../../graphql/getOrder'
import {
  formatOrderBirr,
  resolveOrderProductImageUrl,
} from '../order-detail.utils'

type OrderItemListProps = {
  items: NonNullable<OrderDetailData['getOrder']>['items']
  orderId: string
}

export function OrderItemList({ items, orderId }: OrderItemListProps) {
  return (
    <div className="flex flex-col gap-0">
      {items.map((item, index) => (
        <div key={`${orderId}-${index}`}>
          <article className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-center gap-3 py-3">
            <img
              src={resolveOrderProductImageUrl(item.product.imageUrl)}
              alt=""
              className="size-[62px] rounded-lg bg-muted object-cover"
            />
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-black">{item.product.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">x{item.quantity}</p>
            </div>
            <strong className="whitespace-nowrap text-sm font-black">
              {formatOrderBirr(item.priceAtTime * item.quantity)}
            </strong>
          </article>
          {index < items.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  )
}
