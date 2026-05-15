export type Coupon = {
  id: string
  code: string
  discountValue: number
  status: string
  ruleType: string
  minOrderAmount?: number | null
}

export type Banner = {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string | null
  status: string
  createdAt: string
}
