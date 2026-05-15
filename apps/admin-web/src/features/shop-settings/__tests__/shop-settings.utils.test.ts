import { describe, expect, it } from 'vitest'
import type { ShopConfigRow } from '../../../graphql/shopSettings'
import {
  emptyThemeOverrides,
  mapShopToForm,
  normalizeColorValue,
  serializeOverrides,
} from '../shop-settings.utils'

describe('shop settings utils', () => {
  it('maps shop data into form state', () => {
    const shop: ShopConfigRow = {
      id: 'shop-1',
      name: 'Demo Shop',
      description: null,
      contactPhone: '+251',
      logoUrl: null,
      customerThemePreset: 'amber',
      customerThemeOverrides: { primary: '#111111' },
      active: true,
    }
    expect(mapShopToForm(shop)).toMatchObject({
      name: 'Demo Shop',
      description: '',
      contactPhone: '+251',
      logoUrl: '',
      isOpen: true,
      customerThemePreset: 'amber',
      customerThemeOverrides: { primary: '#111111' },
    })
  })

  it('serializes only filled theme overrides', () => {
    const overrides = emptyThemeOverrides()
    overrides.primary = '#111111'
    expect(serializeOverrides(overrides)).toEqual({ primary: '#111111' })
  })

  it('normalizes invalid color picker values', () => {
    expect(normalizeColorValue('not-a-color')).toBe('#d29a31')
    expect(normalizeColorValue('#123abc')).toBe('#123abc')
  })
})

