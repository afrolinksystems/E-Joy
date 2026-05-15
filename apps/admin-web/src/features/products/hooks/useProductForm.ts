import { useState } from 'react'
import type { ProductRow } from '../../../graphql/products'
import { centsToBirrDisplay } from '../../../lib/price'
import { uploadPublicImage } from '../../../lib/upload'
import type { ProductFormState } from '../products.types'
import { emptyProductForm } from '../products.utils'

export function useProductForm() {
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form, setForm] = useState<ProductFormState>(() => emptyProductForm())
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyProductForm())
    setUploadError(null)
    setModalOpen(true)
  }

  function openEdit(product: ProductRow) {
    setEditing(product)
    setForm({
      name: product.name,
      category: product.category,
      priceBirr: centsToBirrDisplay(product.unitPrice),
      imageUrl: product.imageUrl ?? '',
      active: product.active,
    })
    setUploadError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyProductForm())
    setUploadError(null)
  }

  async function handleFileUpload(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadPublicImage(file)
      setForm((current) => ({ ...current, imageUrl: url }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return {
    closeModal,
    editing,
    form,
    handleFileUpload,
    modalOpen,
    openCreate,
    openEdit,
    setForm,
    uploadError,
    uploading,
  }
}

