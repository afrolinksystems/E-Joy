import { useMemo, useState } from 'react'
import { uploadPublicImage } from '../../../lib/upload'
import type {
  ShopSettingsFormState,
  ThemeFieldKey,
  ThemePreset,
} from '../shop-settings.types'
import {
  emptyShopSettingsForm,
  getPreviewTokens,
} from '../shop-settings.utils'

export function useShopSettingsForm() {
  const [form, setForm] = useState<ShopSettingsFormState>(emptyShopSettingsForm)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const previewTokens = useMemo(() => getPreviewTokens(form), [form])

  function setThemePreset(customerThemePreset: ThemePreset) {
    setForm((current) => ({ ...current, customerThemePreset }))
  }

  function setThemeOverride(key: ThemeFieldKey, value: string) {
    setForm((current) => ({
      ...current,
      customerThemeOverrides: {
        ...current.customerThemeOverrides,
        [key]: value,
      },
    }))
  }

  async function onPickLogo(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadPublicImage(file)
      setForm((current) => ({ ...current, logoUrl: url }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return {
    form,
    onPickLogo,
    previewTokens,
    setForm,
    setThemeOverride,
    setThemePreset,
    uploadError,
    uploading,
  }
}

