import * as Sentry from '@sentry/node';

let initialized = false;

export function initErrorTracking(): void {
  const dsn = process.env.BETTER_STACK_SENTRY_DSN?.trim();
  if (!dsn || initialized) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });
  Sentry.setTag('app', 'order-service');
  initialized = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) scope.setContext('context', context);
    Sentry.captureException(error);
  });
}
