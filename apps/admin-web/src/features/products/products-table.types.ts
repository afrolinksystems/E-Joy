export type ProductStatusFilter = 'all' | 'active' | 'inactive'

export type ProductSortValue =
  | 'name-asc'
  | 'name-desc'
  | 'category-asc'
  | 'category-desc'
  | 'price-asc'
  | 'price-desc'
  | 'status-asc'
  | 'status-desc'

export type ProductTableControlState = {
  category: string
  page: number
  pageSize: number
  search: string
  sort: ProductSortValue
  status: ProductStatusFilter
}

export type ProductTableControlActions = {
  clearFilters: () => void
  setCategory: (value: string) => void
  setPage: (value: number) => void
  setPageSize: (value: number) => void
  setSearch: (value: string) => void
  setSort: (value: ProductSortValue) => void
  setStatus: (value: ProductStatusFilter) => void
}

export type ProductTableViewState = {
  categories: string[]
  filteredCount: number
  from: number
  pageCount: number
  rows: ProductRow[]
  to: number
  totalCount: number
}
import type { ProductRow } from '../../graphql/products'
