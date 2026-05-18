import { Info, MapPin, Phone, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../../components/ui/drawer'

type ShopInfoDrawerProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  shopName: string
  tableRef: string
}

export function ShopInfoDrawer({
  onOpenChange,
  open,
  shopName,
  tableRef,
}: ShopInfoDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[88svh] w-full max-w-[480px] rounded-t-[22px] p-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <DrawerHeader className="grid grid-cols-[40px_1fr_40px] items-center text-center">
          <span />
          <div>
            <DrawerTitle className="text-[20px] font-black">{shopName}</DrawerTitle>
            <DrawerDescription>Table {tableRef}</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button type="button" variant="ghost" size="icon-lg" aria-label="Close restaurant info">
              <X />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex flex-col gap-6 px-4 pb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-black">Restaurant info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-[14px] leading-6 text-muted-foreground">
                <div className="grid grid-cols-[86px_1fr] gap-3">
                  <dt>Hours</dt>
                  <dd>Daily 8:00 - 22:00</dd>
                </div>
                <div className="grid grid-cols-[86px_1fr] gap-3">
                  <dt>Address</dt>
                  <dd>E-Joy demo restaurant, table {tableRef}</dd>
                </div>
                <div className="grid grid-cols-[86px_1fr] gap-3">
                  <dt>Phone</dt>
                  <dd>+251 900 000 000</dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-12 rounded-full">
                <Phone data-icon="inline-start" />
                Call
              </Button>
              <Button type="button" variant="outline" className="h-12 rounded-full">
                <MapPin data-icon="inline-start" />
                Navigate
              </Button>
            </CardFooter>
          </Card>
          <Alert>
            <Info />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>Welcome. Order and pay with Telebirr from this table.</AlertDescription>
          </Alert>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
