import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardFooter } from '../../../components/ui/card'
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { RestaurantApplicationForm } from '../application.types'

type ApplicationFormProps = {
  form: RestaurantApplicationForm
  formError: string
  loading: boolean
  onSubmit: (event: React.FormEvent) => void
  setField: (field: keyof RestaurantApplicationForm, value: string) => void
}

export function ApplicationForm({ form, formError, loading, onSubmit, setField }: ApplicationFormProps) {
  return (
    <Card className="shadow-xl">
      <form onSubmit={(event) => void onSubmit(event)}>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="shop-name">Restaurant name</FieldLabel>
              <Input
                id="shop-name"
                value={form.shopName}
                onChange={(event) => setField('shopName', event.target.value)}
                autoComplete="organization"
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-name">Contact person</FieldLabel>
              <Input
                id="contact-name"
                value={form.contactName}
                onChange={(event) => setField('contactName', event.target.value)}
                autoComplete="name"
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
              <Input
                id="contact-phone"
                value={form.contactPhone}
                onChange={(event) => setField('contactPhone', event.target.value)}
                autoComplete="tel"
                className="h-10"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="business-license">Business license or registration number</FieldLabel>
              <Input
                id="business-license"
                value={form.businessLicense}
                onChange={(event) => setField('businessLicense', event.target.value)}
                className="h-10"
              />
            </Field>
          </FieldGroup>
          {formError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Application could not be submitted</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Submit application
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
