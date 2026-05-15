import { useMutation } from '@apollo/client/react'
import { useState, type FormEvent } from 'react'
import {
  SUBMIT_SHOP_APPLICATION,
  type SubmitShopApplicationData,
} from '../../../graphql/auth'
import type { RestaurantApplicationForm, SubmittedApplication } from '../application.types'

const EMPTY_FORM: RestaurantApplicationForm = {
  businessLicense: '',
  contactName: '',
  contactPhone: '',
  shopName: '',
}

export function useRestaurantApplication() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null)
  const [submitApplication, { loading }] =
    useMutation<SubmitShopApplicationData>(SUBMIT_SHOP_APPLICATION)

  function setField(field: keyof RestaurantApplicationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    const input = {
      shopName: form.shopName.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      businessLicense: form.businessLicense.trim(),
    }
    if (!input.shopName || !input.contactName || !input.contactPhone || !input.businessLicense) {
      setFormError('Please fill in every field.')
      return
    }
    try {
      const result = await submitApplication({ variables: { input } })
      const application = result.data?.submitShopApplication
      if (!application) throw new Error('Application was not submitted.')
      setSubmitted(application)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Application failed.')
    }
  }

  return {
    form,
    formError,
    loading,
    setField,
    submit,
    submitted,
  }
}
