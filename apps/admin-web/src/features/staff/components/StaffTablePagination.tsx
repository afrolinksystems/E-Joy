import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '../../../components/ui/pagination'
import type { StaffTableControlActions, StaffTableControlState, StaffTableViewState } from '../staff-table.types'

type StaffTablePaginationProps = {
  actions: StaffTableControlActions
  controls: StaffTableControlState
  view: Pick<StaffTableViewState, 'filteredCount' | 'from' | 'pageCount' | 'to'>
}

export function StaffTablePagination({ actions, controls, view }: StaffTablePaginationProps) {
  const canGoBack = controls.page > 1
  const canGoForward = controls.page < view.pageCount

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t bg-card px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {view.filteredCount === 0
          ? 'No staff to show'
          : `Showing ${view.from}-${view.to} of ${view.filteredCount}`}
      </p>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button type="button" variant="ghost" disabled={!canGoBack} onClick={() => actions.setPage(controls.page - 1)}>
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Button>
          </PaginationItem>
          {visiblePages(controls.page, view.pageCount).map((page) => (
            <PaginationItem key={page}>
              <Button
                type="button"
                variant={page === controls.page ? 'outline' : 'ghost'}
                size="icon"
                aria-current={page === controls.page ? 'page' : undefined}
                onClick={() => actions.setPage(page)}
              >
                {page}
              </Button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button type="button" variant="ghost" disabled={!canGoForward} onClick={() => actions.setPage(controls.page + 1)}>
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function visiblePages(page: number, pageCount: number) {
  const start = Math.max(1, Math.min(page - 1, pageCount - 2))
  const end = Math.min(pageCount, start + 2)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
