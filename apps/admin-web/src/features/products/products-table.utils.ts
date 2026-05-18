import type { ProductRow } from '../../graphql/products'
import type { ProductSortValue, ProductStatusFilter, ProductTableControlState } from './products-table.types'

export const PRODUCT_PAGE_SIZE_OPTIONS = [10, 25, 50]

export const PRODUCT_SORT_OPTIONS: { label: string; value: ProductSortValue }[] = [
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
  { label: 'Category A-Z', value: 'category-asc' },
  { label: 'Category Z-A', value: 'category-desc' },
  { label: 'Price low-high', value: 'price-asc' },
  { label: 'Price high-low', value: 'price-desc' },
  { label: 'Status active first', value: 'status-asc' },
  { label: 'Status inactive first', value: 'status-desc' },
]

export function getProductCategories(rows: ProductRow[]) {
  return [...new Set(rows.map((row) => row.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export function getFilteredProducts(rows: ProductRow[], controls: ProductTableControlState) {
  const query = controls.search.trim().toLowerCase()

  return rows.filter((row) => {
    const matchesSearch =
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.category.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query)
    const matchesCategory = controls.category === 'all' || row.category === controls.category
    const matchesStatus = controls.status === 'all' || getStatusFilter(row) === controls.status

    return matchesSearch && matchesCategory && matchesStatus
  })
}

export function getSortedProducts(rows: ProductRow[], sort: ProductSortValue) {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'category-asc':
        return a.category.localeCompare(b.category)
      case 'category-desc':
        return b.category.localeCompare(a.category)
      case 'price-asc':
        return a.unitPrice - b.unitPrice
      case 'price-desc':
        return b.unitPrice - a.unitPrice
      case 'status-asc':
        return Number(b.active) - Number(a.active)
      case 'status-desc':
        return Number(a.active) - Number(b.active)
      case 'name-asc':
      default:
        return a.name.localeCompare(b.name)
    }
  })
}

export function getPaginatedProducts(rows: ProductRow[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

export function getProductPageBounds(filteredCount: number, page: number, pageSize: number) {
  if (filteredCount === 0) return { from: 0, to: 0 }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, filteredCount)

  return { from, to }
}

function getStatusFilter(row: ProductRow): ProductStatusFilter {
  return row.active ? 'active' : 'inactive'
}
