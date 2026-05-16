import type React from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { ShopSettingsFormState } from '../shop-settings.types'

type BrandingSectionProps = {
  disabled: boolean
  form: ShopSettingsFormState
  uploadError: string | null
  uploading: boolean
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
  onPickLogo: (file: File | undefined) => void
}

export function BrandingSection({
  disabled,
  form,
  uploadError,
  uploading,
  onFormChange,
  onPickLogo,
}: BrandingSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Upload your shop logo; it is stored as a public URL</CardDescription>
      </CardHeader>
      <CardContent>
        <Field data-invalid={Boolean(uploadError)} data-disabled={disabled}>
          <FieldLabel htmlFor="settings-logo">Logo image</FieldLabel>
          <Input
            id="settings-logo"
            type="file"
            accept="image/*"
            disabled={disabled}
            aria-invalid={Boolean(uploadError)}
            onChange={(event) => {
              const file = event.target.files?.[0]
              onPickLogo(file)
              event.target.value = ''
            }}
            className="h-10"
          />
          {uploading ? <FieldDescription>Uploading...</FieldDescription> : null}
          {uploadError ? <FieldError>{uploadError}</FieldError> : null}
          {form.logoUrl ? (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="size-20 rounded-lg object-cover ring-1 ring-border"
              />
              <Button
                type="button"
                variant="link"
                disabled={disabled}
                onClick={() =>
                  onFormChange((current) => ({ ...current, logoUrl: '' }))
                }
                className="px-0"
              >
                Remove logo
              </Button>
            </div>
          ) : null}
        </Field>
      </CardContent>
    </Card>
  )
}
