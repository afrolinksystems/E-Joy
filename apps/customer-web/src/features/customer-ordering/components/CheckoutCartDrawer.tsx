import { ArrowLeft, ShoppingCart, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../../../components/ui/drawer'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../../components/ui/empty'
import { Field, FieldLabel } from '../../../components/ui/field'
import { InputGroup, InputGroupTextarea } from '../../../components/ui/input-group'
import { Separator } from '../../../components/ui/separator'
import { Spinner } from '../../../components/ui/spinner'
import type { CartItem } from '../../../store/useCartStore'
import type { CreatedOrderModel } from '../customer-ordering.types'
import { buildCartKey, formatBirr } from '../customer-ordering.utils'
import { QuantityStepper } from './QuantityStepper'

type CheckoutCartDrawerProps = {
  cart: CartItem[]
  checkoutLoading: boolean
  deleteItem: (id: string, remark?: string) => void
  incrementItem: (id: string, remark?: string) => void
  lastOrder: CreatedOrderModel | null
  note: string
  onClear: () => void
  onOpenChange: (open: boolean) => void
  onPay: () => Promise<void>
  open: boolean
  removeItem: (id: string, remark?: string) => void
  setNote: (value: string) => void
  totalPrice: number
  totalQuantity: number
}

export function CheckoutCartDrawer(props: CheckoutCartDrawerProps) {
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    try {
      await props.onPay()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Drawer open={props.open} onOpenChange={props.onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90svh] w-full max-w-[480px] overflow-hidden rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <DrawerHeader className="grid grid-cols-[40px_1fr_40px] items-center text-center">
          <DrawerClose asChild>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Back">
              <ArrowLeft />
            </Button>
          </DrawerClose>
          <div>
            <DrawerTitle className="text-[21px] font-black">Cart</DrawerTitle>
            <DrawerDescription>{props.totalQuantity} items selected</DrawerDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-lg" onClick={props.onClear} aria-label="Clear cart">
            <Trash2 />
          </Button>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <Alert className="mb-3">
            <UtensilsCrossed />
            <AlertTitle>Dine-in order</AlertTitle>
            <AlertDescription>Your order is linked to this table.</AlertDescription>
          </Alert>

          {props.cart.length === 0 ? (
            <Empty className="min-h-[220px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCart />
                </EmptyMedia>
                <EmptyTitle>Your cart is empty</EmptyTitle>
                <EmptyDescription>Add items from the menu to continue.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-0 p-0">
                {props.cart.map((line, index) => (
                  <div key={buildCartKey(line.id, line.remark)}>
                    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-black">{line.name}</h3>
                        {line.remark ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{line.remark}</p> : null}
                        <strong className="mt-2 block text-[18px] font-black">{formatBirr(line.price)}</strong>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => props.deleteItem(line.id, line.remark)}
                          aria-label={`Remove ${line.name}`}
                        >
                          <X />
                        </Button>
                        <QuantityStepper
                          onDecrement={() => props.removeItem(line.id, line.remark)}
                          onIncrement={() => props.incrementItem(line.id, line.remark)}
                          quantity={line.quantity}
                        />
                      </div>
                    </article>
                    {index < props.cart.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="mt-3">
            <CardContent className="flex items-baseline justify-between">
              <span className="text-[16px] text-muted-foreground">Total</span>
              <strong className="text-[25px] font-black">{formatBirr(props.totalPrice)}</strong>
            </CardContent>
          </Card>

          <Field className="mt-3">
            <FieldLabel htmlFor="order-note">Order note</FieldLabel>
            <InputGroup className="min-h-[92px] bg-card">
              <InputGroupTextarea
                id="order-note"
                maxLength={120}
                value={props.note}
                onChange={(e) => props.setNote(e.target.value)}
                placeholder="Write taste or serving requests"
              />
            </InputGroup>
          </Field>

          {props.lastOrder ? (
            <Alert className="mt-3 border-green-200 bg-green-50 text-green-800">
              <AlertTitle>Last order: {props.lastOrder.orderNo}</AlertTitle>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>Checkout failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DrawerFooter className="grid grid-cols-[0.78fr_1.42fr] gap-3">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="h-13 rounded-full">
              Continue ordering
            </Button>
          </DrawerClose>
          <Button
            type="button"
            className="h-13 rounded-full font-black"
            disabled={!props.cart.length || props.checkoutLoading}
            onClick={() => void submit()}
          >
            {props.checkoutLoading ? (
              <>
                <Spinner data-icon="inline-start" />
                Processing...
              </>
            ) : (
              'Pay with Telebirr'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
