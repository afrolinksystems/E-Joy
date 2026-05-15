/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL: string
  /** Customer Web base URL (no trailing slash), used for table QR deep links */
  readonly VITE_CUSTOMER_WEB_URL?: string
  readonly VITE_ORDER_SERVICE_ORIGIN?: string
  /** Overrides default shop id for dispatch / GraphQL variables */
  readonly VITE_SHOP_ID?: string
  readonly VITE_BETTER_STACK_SENTRY_DSN?: string
  readonly VITE_APP_ENV?: string
  readonly VITE_APP_RELEASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
