/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL?: string;
  readonly VITE_DEFAULT_SHOP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
