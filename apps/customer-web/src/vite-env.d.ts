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

declare module '@hugeicons/react' {
  export const HugeiconsIcon: import('react').ComponentType<Record<string, unknown>>
}

declare module '@hugeicons/core-free-icons' {
  export const Alert02Icon: unknown
  export const ArrowDown01Icon: unknown
  export const ArrowDownIcon: unknown
  export const ArrowLeft01Icon: unknown
  export const ArrowLeftIcon: unknown
  export const ArrowRight01Icon: unknown
  export const ArrowRightIcon: unknown
  export const ArrowUp01Icon: unknown
  export const Cancel01Icon: unknown
  export const CheckmarkCircle02Icon: unknown
  export const InformationCircleIcon: unknown
  export const Loading03Icon: unknown
  export const MinusSignIcon: unknown
  export const MoreHorizontalCircle01Icon: unknown
  export const MultiplicationSignCircleIcon: unknown
  export const SearchIcon: unknown
  export const SidebarLeftIcon: unknown
  export const Tick02Icon: unknown
  export const UnfoldMoreIcon: unknown
}

declare module 'react-day-picker' {
  export const DayPicker: import('react').ComponentType<Record<string, unknown>>
  export function getDefaultClassNames(): Record<string, string>
  export type DayButton = import('react').ComponentType<Record<string, unknown>>
  export type Locale = Record<string, unknown>
}
