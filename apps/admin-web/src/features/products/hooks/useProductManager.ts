import { useMutation, useQuery } from '@apollo/client/react'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ARCHIVE_PRODUCT,
  CREATE_PRODUCT,
  PRODUCTS,
  UPDATE_PRODUCT,
  type ProductRow,
} from '../../../graphql/products'
import { useAdminSession } from '../../../lib/adminSession'
import { birrInputToCents } from '../../../lib/price'
import type { ProductToast } from '../products.types'
import { formatSubmitError, graphqlErrorMessage } from '../products.utils'
import { useProductForm } from './useProductForm'

export function useProductManager() {
  const { shopId } = useAdminSession()
  const productForm = useProductForm()
  const [toast, setToast] = useState<ProductToast | null>(null)

  const { data, loading, error, refetch } = useQuery<{ products: ProductRow[] }>(
    PRODUCTS,
    {
      variables: { shopId, category: undefined },
      fetchPolicy: 'network-only',
    },
  )

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT)
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT)
  const [archiveProduct, { loading: archiving }] = useMutation(ARCHIVE_PRODUCT)

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function openCreate() {
    setToast(null)
    productForm.openCreate()
  }

  function openEdit(product: ProductRow) {
    setToast(null)
    productForm.openEdit(product)
  }

  function closeModal() {
    setToast(null)
    productForm.closeModal()
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const form = productForm.form
    const unitPrice = birrInputToCents(form.priceBirr)
    if (!form.name.trim() || !form.category.trim()) return

    setToast(null)
    try {
      const imageUrl = form.imageUrl.trim()
      if (productForm.editing) {
        await updateProduct({
          variables: {
            productId: productForm.editing.id,
            shopId,
            input: {
              name: form.name.trim(),
              category: form.category.trim(),
              unitPrice,
              imageUrl,
              active: form.active,
            },
          },
        })
      } else {
        await createProduct({
          variables: {
            shopId,
            input: {
              name: form.name.trim(),
              category: form.category.trim(),
              unitPrice,
              ...(imageUrl ? { imageUrl } : {}),
              active: form.active,
            },
          },
        })
      }
      await refetch()
      closeModal()
    } catch (err) {
      setToast({
        variant: 'error',
        message: formatSubmitError(err) ?? 'Could not save. Please try again.',
      })
    }
  }

  function onArchiveClick(product: ProductRow) {
    if (
      !window.confirm('Are you sure you want to remove this item from the active menu?')
    ) {
      return
    }

    void (async () => {
      setToast(null)
      try {
        await archiveProduct({ variables: { productId: product.id, shopId } })
        await refetch()
      } catch (err) {
        const raw = graphqlErrorMessage(err)
        setToast({
          variant: 'error',
          message: raw.trim() ? raw : 'Could not archive this item.',
        })
      }
    })()
  }

  return {
    archiving,
    closeModal,
    error,
    loading,
    onArchiveClick,
    onSubmit,
    openCreate,
    openEdit,
    productForm,
    rows: data?.products ?? [],
    saving: creating || updating,
    shopId,
    toast,
  }
}

