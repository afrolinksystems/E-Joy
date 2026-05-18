import { Home, ReceiptText, UserCircle, UtensilsCrossed } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import type { CustomerTab } from '../customer-ordering.types'
import { tabLabel } from '../customer-ordering.utils'

type BottomTabsProps = {
  activeTab: CustomerTab
  onSelect: (tab: CustomerTab) => void
  totalQuantity: number
}

export function BottomTabs({
  activeTab,
  onSelect,
  totalQuantity,
}: BottomTabsProps) {
  const tabs: Array<{ id: CustomerTab; Icon: typeof Home }> = [
    { id: 'home', Icon: Home },
    { id: 'menu', Icon: UtensilsCrossed },
    { id: 'orders', Icon: ReceiptText },
    { id: 'profile', Icon: UserCircle },
  ]

  return (
    <Tabs value={activeTab} onValueChange={(value) => onSelect(value as CustomerTab)} className="fixed bottom-0 left-1/2 z-[35] w-[min(480px,100vw)] -translate-x-1/2">
      <TabsList className="grid h-auto w-full grid-cols-4 rounded-none border-t bg-card/95 p-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-8px_20px_rgba(0,0,0,0.04)] backdrop-blur">
        {tabs.map(({ id, Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-12 flex-col gap-1 rounded-lg text-[11px] font-bold data-active:text-primary"
          >
            <span className="relative grid min-h-6 place-items-center">
              <Icon />
              {id === 'menu' && totalQuantity > 0 ? (
                <Badge className="absolute -right-3 -top-2 min-w-4 justify-center px-1 text-[9px]" variant="destructive">
                  {totalQuantity}
                </Badge>
              ) : null}
            </span>
            {tabLabel(id)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
