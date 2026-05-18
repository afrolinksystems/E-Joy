import type React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import type { ShopSettingsFormState } from '../shop-settings.types'

type BasicInfoSectionProps = {
  form: ShopSettingsFormState
  onFormChange: React.Dispatch<React.SetStateAction<ShopSettingsFormState>>
}

export function BasicInfoSection({ form, onFormChange }: BasicInfoSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Basic information</CardTitle>
        <CardDescription>Public-facing name and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="settings-shop-name">Shop name *</FieldLabel>
            <Input
              id="settings-shop-name"
              required
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-description">Description</FieldLabel>
            <Textarea
              id="settings-description"
              value={form.description}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder="Briefly describe your concept, hours, or specialties"
              className="resize-y"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-contact-phone">Contact phone</FieldLabel>
            <Input
              id="settings-contact-phone"
              inputMode="tel"
              value={form.contactPhone}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  contactPhone: event.target.value,
                }))
              }
              placeholder="+251 ..."
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
