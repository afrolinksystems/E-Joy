// apps/admin-web/src/components/table/TablePagination.tsx

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Props = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
};

export default function TablePagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onPageChange,
  onFirstPage,
  onLastPage,
}: Props) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current
    const range: (number | string)[] = [];
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    
    range.unshift(1);
    if (totalPages !== 1) {
      range.push(totalPages);
    }
    
    // Remove duplicates if delta is large
    return [...new Set(range)];
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-slate-200 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Page info - mobile friendly */}
        <div className="text-sm text-slate-600 order-2 sm:order-1">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
        
        {/* Pagination buttons */}
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* First Page Button */}
          {onFirstPage && (
            <button
              onClick={onFirstPage}
              disabled={currentPage === 1}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
              <span className="hidden md:inline">First</span>
            </button>
          )}
          
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          {/* Page Number Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((page, idx) => (
              typeof page === 'number' ? (
                <button
                  key={idx}
                  onClick={() => onPageChange?.(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-orange-500 text-white cursor-default'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-2 text-slate-400">
                  {page}
                </span>
              )
            ))}
          </div>
          
          {/* Mobile: Show current page indicator */}
          <div className="sm:hidden px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-700">
            {currentPage} / {totalPages}
          </div>
          
          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Last Page Button */}
          {onLastPage && (
            <button
              onClick={onLastPage}
              disabled={currentPage === totalPages}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              <span className="hidden md:inline">Last</span>
              <ChevronsRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}