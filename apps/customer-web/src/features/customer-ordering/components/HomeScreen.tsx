import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'

type HomeScreenProps = {
  onStart: () => void
  shopName: string
}

export function HomeScreen({ onStart, shopName }: HomeScreenProps) {
  return (
    <section className="relative min-h-svh overflow-hidden bg-black text-white">
      <img
        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=82"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black" />
      <div className="relative flex min-h-svh flex-col px-7 pb-[calc(104px+env(safe-area-inset-bottom))] pt-[calc(42px+env(safe-area-inset-top))]">
        <Badge className="ml-auto bg-white/90 text-neutral-900" variant="secondary">
          Table ordering
        </Badge>
        <div className="mt-auto flex flex-col gap-3">
          <h1 className="max-w-[12ch] text-[34px] font-black leading-[1.06]">
            {shopName}
          </h1>
          <p className="max-w-[260px] text-[15px] font-medium leading-6 text-white/80">
            Browse the menu, pay with Telebirr, and we bring the order to your table.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={onStart}
            className="mt-5 h-14 rounded-full text-[18px] font-black shadow-xl"
          >
            Start ordering
          </Button>
        </div>
      </div>
    </section>
  )
}
