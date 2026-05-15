import { Loader2 } from 'lucide-react'
import { BasicInfoSection } from './components/BasicInfoSection'
import { BrandingSection } from './components/BrandingSection'
import { OperatingStatusSection } from './components/OperatingStatusSection'
import { ShopSettingsHeader } from './components/ShopSettingsHeader'
import { StickySaveBar } from './components/StickySaveBar'
import { ThemeSection } from './components/ThemeSection'
import { useShopSettings } from './hooks/useShopSettings'

export function ShopSettings() {
  const state = useShopSettings()
  const { formState } = state
  const gqlError = state.error?.message

  return (
    <div className="relative pb-28">
      <ShopSettingsHeader shopId={state.shopId} />
      {gqlError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {gqlError}
        </div>
      ) : null}
      <form
        id="shop-settings-form"
        onSubmit={state.onSubmit}
        className="space-y-6"
      >
        <fieldset disabled={state.disabled} className="space-y-6">
          <BasicInfoSection
            form={formState.form}
            onFormChange={formState.setForm}
          />
          <BrandingSection
            disabled={state.disabled}
            form={formState.form}
            uploadError={formState.uploadError}
            uploading={formState.uploading}
            onFormChange={formState.setForm}
            onPickLogo={(file) => void formState.onPickLogo(file)}
          />
          <ThemeSection
            form={formState.form}
            previewTokens={formState.previewTokens}
            onPresetChange={formState.setThemePreset}
            onThemeOverrideChange={formState.setThemeOverride}
          />
          <OperatingStatusSection
            disabled={state.disabled}
            form={formState.form}
            onFormChange={formState.setForm}
          />
        </fieldset>
      </form>
      {!state.hydrated && !state.error ? (
        <div className="absolute inset-0 z-30 flex cursor-wait items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-md ring-1 ring-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            Loading shop...
          </div>
        </div>
      ) : null}
      <StickySaveBar disabled={state.disabled} saving={state.saving} />
      {state.toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {state.toast}
        </div>
      ) : null}
    </div>
  )
}

