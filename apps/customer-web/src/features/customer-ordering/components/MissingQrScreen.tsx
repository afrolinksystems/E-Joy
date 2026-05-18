import { UtensilsCrossed } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { EmptyMedia } from '../../../components/ui/empty'

export function MissingQrScreen() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.66)),url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
      <Card className="w-full max-w-[390px] bg-card/95 text-center shadow-xl">
        <CardHeader className="items-center">
          <EmptyMedia variant="icon" className="size-20 rounded-[26px] bg-secondary text-secondary-foreground">
            <UtensilsCrossed />
          </EmptyMedia>
          <CardTitle className="text-[25px] font-black">Scan your table QR code</CardTitle>
          <CardDescription className="max-w-[290px] text-[15px] leading-6">
            Open this mini app from the QR code on your table so we know where to send your food.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <span>Local demo URL:</span>
            <code className="break-words text-foreground">?shopId=test-shop-001&amp;table=test-table-001</code>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
