import { useEffect, useMemo, useState } from 'react'
import type { ProductRow } from '../../../graphql/products'
import type {
  ProductSortValue,
  ProductStatusFilter,
  ProductTableControlState,
} from '../products-table.types'
import {
  getFilteredProducts,
  getPaginatedProducts,
  getProductCategories,
  getProductPageBounds,
  getSortedProducts,
  PRODUCT_PAGE_SIZE_OPTIONS,
} from '../products-table.utils'

export function useProductTableControls(rows: ProductRow[]) {
  const [search, setSearchValue] = useState('')
  const [category, setCategoryValue] = useState('all')
  const [status, setStatusValue] = useState<ProductStatusFilter>('all')
  const [sort, setSortValue] = useState<ProductSortValue>('name-asc')
  const [pageSize, setPageSizeValue] = useState(PRODUCT_PAGE_SIZE_OPTIONS[0])
  const [page, setPage] = useState(1)

  const controls: ProductTableControlState = useMemo(
    () => ({
      category,
      page,
      pageSize,
      search,
      sort,
      status,
    }),
    [category, page, pageSize, search, sort, status]
  )

  const categories = useMemo(() => getProductCategories(rows), [rows])
  const filteredRows = useMemo(() => getFilteredProducts(rows, controls), [rows, controls])
  const sortedRows = useMemo(() => getSortedProducts(filteredRows, sort), [filteredRows, sort])
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const visibleRows = useMemo(() => getPaginatedProducts(sortedRows, page, pageSize), [sortedRows, page, pageSize])
  const bounds = getProductPageBounds(sortedRows.length, page, pageSize)

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  return {
    actions: {
      clearFilters: () => {
        setSearchValue('')
        setCategoryValue('all')
        setStatusValue('all')
        setSortValue('name-asc')
        setPage(1)
      },
      setCategory: resetPage(setCategoryValue),
      setPage,
      setPageSize: resetPage(setPageSizeValue),
      setSearch: resetPage(setSearchValue),
      setSort: resetPage(setSortValue),
      setStatus: resetPage(setStatusValue),
    },
    controls,
    view: {
      categories,
      filteredCount: sortedRows.length,
      from: bounds.from,
      pageCount,
      rows: visibleRows,
      to: bounds.to,
      totalCount: rows.length,
    },
  }
}
