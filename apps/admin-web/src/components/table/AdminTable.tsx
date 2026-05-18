// apps/admin-web/src/components/table/AdminTable.tsx

import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

export type Column<T = Record<string, unknown>> = {
  key: keyof T | string;
  title: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  width?: string;
  fixed?: 'left' | 'right';
};

type DataRow = Record<string, unknown>;

type Props<T = DataRow> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  searchTerm?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
  };
};

export default function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  error,
  errorMessage,
  onRetry,
  onSearch,
  searchPlaceholder = "Search...",
  searchTerm: externalSearchTerm,
  emptyTitle = "No data found",
  emptyDescription = "There are no records available.",
  emptyActionLabel,
  onEmptyAction,
  pagination,
}: Props<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const filteredData = searchTerm
    ? sortedData.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : sortedData;

  const getPaginatedData = () => {
    if (!pagination) return filteredData;
    
    const { currentPage, itemsPerPage = 10 } = pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();
  const totalPages = pagination?.totalPages || Math.ceil(filteredData.length / (pagination?.itemsPerPage || 10));

  const handleSearchChange = (term: string) => {
    setInternalSearchTerm(term);
    onSearch?.(term);
    if (pagination?.onPageChange) {
      pagination.onPageChange(1);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((_col, idx) => (
                  <th key={idx} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                  {columns.map((_col, idx) => (
                    <td key={idx} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to load data
        </h3>
        <p className="text-red-700 mb-4">
          {errorMessage || 'There was an error loading the table data.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // EMPTY STATE - Search no results
  if (filteredData.length === 0 && searchTerm) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-gray-400 text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No results found
        </h3>
        <p className="text-gray-600">
          No items match "{searchTerm}". Try a different search term.
        </p>
      </div>
    );
  }

  // EMPTY STATE - No data
  if (filteredData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-gray-400 text-4xl mb-3">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {emptyTitle}
        </h3>
        <p className="text-gray-600 mb-4">
          {emptyDescription}
        </p>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  // TABLE UI - ONLY TABLE BODY SCROLLS
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Search Bar */}
      {onSearch && (
        <div className="border-b border-slate-200 bg-slate-50/50 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Fixed Table Header - NO SCROLL HERE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-200">
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`px-4 py-3 text-${column.align || 'left'} text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                    column.hideOnMobile ? 'hidden sm:table-cell' : ''
                  } ${column.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''} ${
                    column.fixed === 'left' ? 'sticky left-0 bg-slate-50 z-20 shadow-sm' : ''
                  } ${column.fixed === 'right' ? 'sticky right-0 bg-slate-50 z-20 shadow-sm' : ''}`}
                  style={{ width: column.width, minWidth: column.width }}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span>{column.title}</span>
                    {column.sortable && sortBy === column.key && (
                      sortOrder === 'asc' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* SCROLLABLE TABLE BODY - ONLY THIS PART HAS SCROLLBAR */}
      <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {paginatedData.map((row, index) => (
              <tr 
                key={(row.id as string) || index} 
                className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={`px-4 py-3 text-${column.align || 'left'} text-sm ${
                      column.hideOnMobile ? 'hidden sm:table-cell' : ''
                    } ${
                      column.fixed === 'left' ? 'sticky left-0 bg-white z-10 shadow-sm' : ''
                    } ${column.fixed === 'right' ? 'sticky right-0 bg-white z-10 shadow-sm' : ''}`}
                    style={{ 
                      minWidth: column.width,
                      backgroundColor: column.fixed ? 'white' : undefined
                    }}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : (row[column.key] !== undefined && row[column.key] !== null 
                        ? String(row[column.key]) 
                        : '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - NO SCROLL HERE */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-slate-600 order-2 sm:order-1">
              Showing {((pagination.currentPage - 1) * (pagination.itemsPerPage || 10)) + 1} to{' '}
              {Math.min(pagination.currentPage * (pagination.itemsPerPage || 10), filteredData.length)} of{' '}
              {filteredData.length} items
            </div>
            
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                «
              </button>
              
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              
              <div className="flex gap-1">
                {(() => {
                  const pages = [];
                  const total = totalPages;
                  const current = pagination.currentPage;
                  const maxVisible = 5;
                  
                  let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
                  const endPage = Math.min(total, startPage + maxVisible - 1);
                  
                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => pagination.onPageChange(i)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          i === pagination.currentPage
                            ? 'bg-orange-500 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>
              
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
              
              <button
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={pagination.currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!pagination && filteredData.length > 10 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-white text-center text-sm text-slate-600">
          Showing {filteredData.length} items. Use search to filter results.
        </div>
      )}
    </div>
  );
}