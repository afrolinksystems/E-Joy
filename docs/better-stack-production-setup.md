# Better Stack Production Setup

Use Better Stack as the v1 monitoring surface for E-Joy: backend logs, uptime checks, and Sentry-compatible error tracking.

## Better Stack Sources

Create these sources/projects in Better Stack:

- Logs source: `order-service-production`
- Sentry-compatible error source: `order-service`
- Sentry-compatible error source: `admin-web`
- Sentry-compatible error source: `super-admin-web`
- Sentry-compatible error source: `customer-web`

Keep each frontend on its own DSN so errors are grouped by deployed app instead of mixed together.

## Render Environment Variables

Set these on the Render `order-service` production service:

```env
SERVICE_NAME=order-service
NODE_ENV=production
APP_RELEASE=<current-git-sha-or-release-version>
LOG_LEVEL=info
LOG_TO_BETTER_STACK=true
BETTER_STACK_INGEST_URL=https://in.logs.betterstack.com
BETTER_STACK_SOURCE_TOKEN=<order-service-production-logs-source-token>
BETTER_STACK_SENTRY_DSN=<order-service-sentry-compatible-dsn>
```

The backend-only env template lives at `apps/order-service/.env.example`.
Use that file as the source of truth for order-service variables; do not put
frontend `VITE_*` variables into Render for the backend service.

After saving env vars, redeploy the Render service.

## Vercel Environment Variables

Set these on each Vercel project for Production, Preview, and Development as appropriate.
Each frontend owns its own env template:

- `apps/admin-web/.env.example`
- `apps/super-admin-web/.env.example`
- `apps/customer-web/.env.example`

`admin-web`:

```env
VITE_BETTER_STACK_SENTRY_DSN=<admin-web-sentry-compatible-dsn>
VITE_APP_ENV=production
VITE_APP_RELEASE=<current-git-sha-or-release-version>
```

`super-admin-web`:

```env
VITE_BETTER_STACK_SENTRY_DSN=<super-admin-web-sentry-compatible-dsn>
VITE_APP_ENV=production
VITE_APP_RELEASE=<current-git-sha-or-release-version>
```

`customer-web`:

```env
VITE_BETTER_STACK_SENTRY_DSN=<customer-web-sentry-compatible-dsn>
VITE_APP_ENV=production
VITE_APP_RELEASE=<current-git-sha-or-release-version>
```

Redeploy each Vercel app after saving env vars. Vite only embeds `VITE_*` values at build time.

## Uptime Monitors

Create these Better Stack uptime monitors:

- Backend health: `https://<render-order-service-domain>/health`
- Backend dependencies: `https://<render-order-service-domain>/health/dependencies`
- Customer app: `https://<customer-web-domain>/`
- Admin app: `https://<admin-web-domain>/`
- Super admin app: `https://<super-admin-web-domain>/`

Recommended free-plan settings:

- Check interval: 3-5 minutes
- Confirm downtime after: 2 failed checks
- Expected status: `200`
- Alert on SSL expiration if Better Stack offers it for the monitor

## Alerts

Create alerts for:

- Backend health down for 2 consecutive checks
- Any frontend app down for 2 consecutive checks
- Log event `auth.refresh.reuse_detected`
- High count of log event `auth.login.failed`
- Log event `payment.callback.failed`
- Backend log field `statusCode >= 500`
- New unhandled exception in any Sentry-compatible source

Keep auth alert thresholds conservative at first. A good starting point is 10 failed logins in 5 minutes, then adjust after observing real traffic.

## Smoke Test

After redeploy:

1. Open `GET /health` and confirm `ok: true`.
2. Open `GET /health/dependencies` and confirm `dependencies.db` is `ok`.
3. Attempt one invalid admin login and confirm an `auth.login.failed` log appears without password/token/cookie values.
4. Trigger one known frontend error in a staging deployment and confirm it reaches the matching frontend error source.
5. Confirm all uptime monitors turn green.
