import type { Page } from './platform-console.types'

export function titleFor(page: Page): string {
  return page === 'dashboard'
    ? 'Dashboard'
    : page === 'applications'
      ? 'Applications'
      : page === 'restaurants'
        ? 'Restaurants'
        : page === 'marketing'
          ? 'Marketing'
          : page === 'operations'
            ? 'Operations'
            : 'Audit logs'
}

export function formatMoney(cents: number): string {
  return `${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}
