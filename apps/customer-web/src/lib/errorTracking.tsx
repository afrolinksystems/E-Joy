import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'
import { errorTrackingDsn } from './tracking'

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  if (!errorTrackingDsn) return children
  return (
    <Sentry.ErrorBoundary fallback={<RootErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  )
}

function RootErrorFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <section className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page. The error has been recorded for review.
        </p>
      </section>
    </main>
  )
}
