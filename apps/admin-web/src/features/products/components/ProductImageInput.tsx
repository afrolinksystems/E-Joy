import { Button } from '../../../components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { ProductFormState } from '../products.types'

type ProductImageInputProps = {
  form: ProductFormState
  uploadError: string | null
  uploading: boolean
  onFileUpload: (file: File | undefined) => void
  onFormChange: React.Dispatch<React.SetStateAction<ProductFormState>>
}

export function ProductImageInput({
  form,
  uploadError,
  uploading,
  onFileUpload,
  onFormChange,
}: ProductImageInputProps) {
  return (
    <Field data-invalid={Boolean(uploadError)}>
      <FieldLabel htmlFor="product-image">Item image</FieldLabel>
      <div className="flex flex-wrap items-start gap-3">
        <Input
          id="product-image"
          type="file"
          accept="image/*"
          disabled={uploading}
          aria-invalid={Boolean(uploadError)}
          onChange={(event) => {
            const file = event.target.files?.[0]
            onFileUpload(file)
            event.target.value = ''
          }}
          className="h-10 min-w-0 flex-1"
        />
        {form.imageUrl ? (
          <img
            src={form.imageUrl}
            alt="Preview"
            className="size-20 shrink-0 rounded-lg object-cover ring-1 ring-border"
          />
        ) : null}
      </div>
      {uploading ? <FieldDescription>Uploading...</FieldDescription> : null}
      {uploadError ? <FieldError>{uploadError}</FieldError> : null}
      {form.imageUrl ? (
        <Button
          type="button"
          variant="link"
          onClick={() => onFormChange((current) => ({ ...current, imageUrl: '' }))}
          className="w-fit px-0"
        >
          Remove image
        </Button>
      ) : null}
    </Field>
  )
}
