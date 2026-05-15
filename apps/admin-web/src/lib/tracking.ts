import * as Sentry from '@sentry/react'

export const errorTrackingDsn = import.meta.env.VITE_BETTER_STACK_SENTRY_DSN?.trim()

export function initErrorTracking() {
  if (!errorTrackingDsn) return
  Sentry.init({
    dsn: errorTrackingDsn,
    environment: import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    initialScope: {
      tags: { app: 'admin-web' },
    },
  })
}

export function captureFrontendException(error: unknown, context?: Record<string, unknown>) {
  if (!errorTrackingDsn) return
  Sentry.withScope((scope: Sentry.Scope) => {
    if (context) scope.setContext('context', context)
    Sentry.captureException(error)
  })
}
