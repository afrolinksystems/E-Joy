import { useMutation, useQuery } from '@apollo/client/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  SHOP,
  UPDATE_SHOP,
  type ShopConfigRow,
} from '../../../graphql/shopSettings'
import { useAdminSession } from '../../../lib/adminSession'
import { mapShopToForm, serializeOverrides } from '../shop-settings.utils'
import { useShopSettingsForm } from './useShopSettingsForm'

export function useShopSettings() {
  const { shopId } = useAdminSession()
  const formState = useShopSettingsForm()
  const { form, setForm, uploading } = formState
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { data, error, refetch } = useQuery<{ shop: ShopConfigRow }>(SHOP, {
    variables: { id: shopId },
    fetchPolicy: 'network-only',
  })

  const [updateShop, { loading: saving }] = useMutation(UPDATE_SHOP, {
    refetchQueries: [{ query: SHOP, variables: { id: shopId } }],
  })

  useEffect(() => {
    const shop = data?.shop
    if (!shop) return
    setForm(mapShopToForm(shop))
    setHydrated(true)
  }, [data, setForm])

  useEffect(() => {
    if (error) setHydrated(true)
  }, [error])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const disabled = !hydrated || saving || uploading

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim() || disabled) return
    try {
      await updateShop({
        variables: {
          shopId,
          input: {
            name: form.name.trim(),
            description: form.description.trim(),
            contactPhone: form.contactPhone.trim(),
            logoUrl: form.logoUrl.trim(),
            isOpen: form.isOpen,
            customerThemePreset: form.customerThemePreset,
            customerThemeOverrides: serializeOverrides(form.customerThemeOverrides),
          },
        },
      })
      setToast('Shop settings saved')
      await refetch()
    } catch {
      return
    }
  }

  return {
    disabled,
    error,
    formState,
    hydrated,
    onSubmit,
    saving,
    shopId,
    toast,
  }
}
