import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button'
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../../components/ui/field'
import { InputGroup, InputGroupTextarea } from '../../../components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import type { MenuItem } from '../customer-ordering.types'
import {
  formatBirr,
  resolveProductImageUrl,
  SPICE_OPTIONS,
} from '../customer-ordering.utils'
import { QuantityStepper } from './QuantityStepper'

type ItemDetailDrawerProps = {
  item: MenuItem | null
  onAdd: (quantity: number, remark: string) => void
  onOpenChange: (open: boolean) => void
}

export function ItemDetailDrawer({
  item,
  onAdd,
  onOpenChange,
}: ItemDetailDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [spice, setSpice] = useState('Mild')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!item) return
    setQuantity(1)
    setSpice('Mild')
    setNote('')
  }, [item])

  const remark = [spice, note.trim()].filter(Boolean).join(' - ')

  return (
    <Drawer open={Boolean(item)} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[92svh] w-full max-w-[480px] overflow-hidden rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {item ? (
          <>
            <div className="relative overflow-hidden rounded-t-2xl">
              <img className="h-[min(42svh,360px)] w-full object-cover" src={resolveProductImageUrl(item.imageUrl)} alt="" />
              <DrawerClose asChild>
                <Button type="button" variant="secondary" size="icon-lg" className="absolute right-4 top-4 rounded-full" aria-label="Close">
                  <X />
                </Button>
              </DrawerClose>
            </div>
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-[25px] font-black">{item.name}</DrawerTitle>
              <DrawerDescription>{formatBirr(item.unitPrice)}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Spice level</FieldLegend>
                  <ToggleGroup
                    value={[spice]}
                    onValueChange={(value) => {
                      const next = value.at(-1)
                      if (next) setSpice(next)
                    }}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {SPICE_OPTIONS.map((option) => (
                      <ToggleGroupItem key={option} value={option} className="min-w-[92px]">
                        {option}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FieldSet>
                <Field>
                  <FieldLabel htmlFor="item-note">Note</FieldLabel>
                  <InputGroup className="min-h-[92px]">
                    <InputGroupTextarea
                      id="item-note"
                      maxLength={80}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Taste, allergy, or serving request"
                    />
                  </InputGroup>
                  <FieldDescription>{80 - note.length} characters left</FieldDescription>
                </Field>
              </FieldGroup>
            </div>
            <DrawerFooter>
              <div className="flex items-center justify-between">
                <strong className="text-[25px] font-black text-primary">{formatBirr(item.unitPrice)}</strong>
                <QuantityStepper
                  onDecrement={() => setQuantity((v) => Math.max(1, v - 1))}
                  onIncrement={() => setQuantity((v) => v + 1)}
                  quantity={quantity}
                />
              </div>
              <Button type="button" className="h-13 rounded-full text-[16px] font-black" onClick={() => onAdd(quantity, remark)}>
                Add to cart
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
