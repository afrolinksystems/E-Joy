import { describe, expect, it } from 'vitest'
import { emptyProductForm, formatSubmitError } from '../products.utils'

describe('products utils', () => {
  it('creates the default product form state', () => {
    expect(emptyProductForm()).toEqual({
      name: '',
      category: '',
      priceBirr: '',
      imageUrl: '',
      active: true,
    })
  })

  it('normalizes duplicate product errors', () => {
    expect(formatSubmitError(new Error('already exists'))).toBe(
      'A product with this name already exists!',
    )
  })
})

