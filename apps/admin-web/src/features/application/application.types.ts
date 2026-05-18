import type { SubmitShopApplicationData } from '../../graphql/auth'

export type RestaurantApplicationForm = {
  businessLicense: string
  contactName: string
  contactPhone: string
  shopName: string
}

export type SubmittedApplication = SubmitShopApplicationData['submitShopApplication']
