/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Preferred shop id for checkout (align with seed `test-shop-001` and admin dispatch) */
  readonly VITE_DEFAULT_SHOP_ID?: string
  readonly VITE_GRAPHQL_URL?: string
  readonly VITE_ORDER_SERVICE_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
