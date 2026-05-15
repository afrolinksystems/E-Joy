import type { ProductFormState } from './products.types'

export function emptyProductForm(): ProductFormState {
  return {
    name: '',
    category: '',
    priceBirr: '',
    imageUrl: '',
    active: true,
  }
}

export function graphqlErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'graphQLErrors' in err) {
    const graphQLErrors = (
      err as { graphQLErrors?: readonly { message?: string }[] }
    ).graphQLErrors
    if (graphQLErrors?.length) {
      return graphQLErrors.map((error) => error.message ?? '').join(' ').trim()
    }
  }
  if (err instanceof Error) return err.message
  return String(err)
}

export function formatSubmitError(err: unknown): string | null {
  const message = graphqlErrorMessage(err)
  const lower = message.toLowerCase()
  if (
    lower.includes('already exists') ||
    lower.includes('conflict') ||
    lower.includes('duplicate')
  ) {
    return 'A product with this name already exists!'
  }
  return message || null
}

