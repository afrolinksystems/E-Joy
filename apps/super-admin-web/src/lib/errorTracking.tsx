import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
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
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>Please refresh the page. The error has been recorded for review.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  )
}
