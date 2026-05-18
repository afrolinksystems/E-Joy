import { Info, ReceiptText, Trash2, UserCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Separator } from '../../../components/ui/separator'
import { ProfileAction } from './ProfileAction'

type ProfileScreenProps = {
  onClearSession: () => void
  onGoOrders: () => void
  shopId: string
  tableRef: string
}

export function ProfileScreen({
  onClearSession,
  onGoOrders,
  shopId,
  tableRef,
}: ProfileScreenProps) {
  return (
    <section className="min-h-svh bg-[linear-gradient(180deg,var(--secondary)_0,var(--background)_210px,var(--card)_100%)] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+96px)]">
      <Card>
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="grid size-[70px] place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <UserCircle />
          </div>
          <div className="min-w-0">
            <h1 className="text-[23px] font-black">Welcome</h1>
            <p className="text-muted-foreground">Telebirr mini app guest</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle className="text-lg font-black">Current table</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Shop: {shopId}</p>
          <p>Table: {tableRef}</p>
        </CardContent>
      </Card>
      <Card className="mt-3">
        <CardContent className="flex flex-col p-0">
          <ProfileAction onClick={onGoOrders} icon={<ReceiptText />} label="My orders" />
          <Separator />
          <ProfileAction icon={<Info />} label="About this restaurant" />
          <Separator />
          <ProfileAction danger onClick={onClearSession} icon={<Trash2 />} label="Clear table session" />
        </CardContent>
      </Card>
    </section>
  )
}
