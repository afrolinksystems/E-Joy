import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const LS_TABLE = 'currentTable'
const LS_SHOP = 'currentShopId'
/** 与 `useTableSession` 对齐的 JSON  blob（扫码后可选擦除 URL） */
const LS_SESSION_JSON = 'ejoy_table_session'

export type TableSessionState = {
  /** Shop id from QR or last session (e.g. test-shop-001) */
  sessionShopId: string | null
  /**
   * Table reference for createOrder `tableId` (backend accepts id or display name).
   * Mirrors URL query `table=`.
   */
  sessionTableRef: string | null
  setFromQrParams: (shopId: string, table: string) => void
  clearSession: () => void
}

function writeLegacyLocalStorage(shopId: string, table: string) {
  try {
    localStorage.setItem(LS_SHOP, shopId)
    localStorage.setItem(LS_TABLE, table)
    localStorage.setItem(
      LS_SESSION_JSON,
      JSON.stringify({ shopId, tableNumber: table }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

function clearLegacyLocalStorage() {
  try {
    localStorage.removeItem(LS_SHOP)
    localStorage.removeItem(LS_TABLE)
    localStorage.removeItem(LS_SESSION_JSON)
  } catch {
    /* ignore */
  }
}

/**
 * QR deep-link session: persisted (Zustand + explicit localStorage keys) so refresh
 * or accidental close does not lose table binding.
 */
export const useTableSessionStore = create<TableSessionState>()(
  persist(
    (set) => ({
      sessionShopId: null,
      sessionTableRef: null,
      setFromQrParams: (shopId, table) => {
        const s = shopId.trim()
        const t = table.trim()
        if (!s || !t) return
        writeLegacyLocalStorage(s, t)
        set({ sessionShopId: s, sessionTableRef: t })
      },
      clearSession: () => {
        clearLegacyLocalStorage()
        set({ sessionShopId: null, sessionTableRef: null })
      },
    }),
    {
      name: 'ejoy_table_session_v1',
      partialize: (state) => ({
        sessionShopId: state.sessionShopId,
        sessionTableRef: state.sessionTableRef,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.sessionShopId || !state.sessionTableRef) return
        writeLegacyLocalStorage(state.sessionShopId, state.sessionTableRef)
      },
    },
  ),
)

/** `ejoy_table_session` JSON（与 useTableSession 一致） */
export function readTableSessionJson(): { shopId: string; table: string } | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_JSON)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { shopId?: unknown; tableNumber?: unknown }
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    const tableNumber = typeof parsed.tableNumber === 'string' ? parsed.tableNumber.trim() : ''
    if (shopId && tableNumber) return { shopId, table: tableNumber }
  } catch {
    /* ignore */
  }
  return null
}

/** Read legacy keys + JSON blob synchronously (before Zustand rehydration completes). */
export function readTableSessionFromLocalStorage(): {
  shopId: string | null
  table: string | null
} {
  const json = readTableSessionJson()
  if (json) return { shopId: json.shopId, table: json.table }
  try {
    const shop = localStorage.getItem(LS_SHOP)?.trim() ?? null
    const table = localStorage.getItem(LS_TABLE)?.trim() ?? null
    if (shop && table) return { shopId: shop, table }
  } catch {
    /* ignore */
  }
  return { shopId: null, table: null }
}
