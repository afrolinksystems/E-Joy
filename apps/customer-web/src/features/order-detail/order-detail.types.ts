export type OrderStatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export type OrderDetailPageProps = {
  orderId: string
  onBack: () => void
}
