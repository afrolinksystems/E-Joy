import { useLayoutEffect, useState } from 'react'
import { readTableSessionFromLocalStorage, useTableSessionStore } from '../store/useTableSessionStore'

export interface TableSession {
  shopId: string
  tableNumber: string
}

type PeekResult = {
  session: TableSession | null
  /** 本次是否来自 URL（需要 replaceState 擦除 query） */
  fromUrl: boolean
}

function peekTableSession(enabled: boolean): PeekResult {
  if (!enabled || typeof window === 'undefined') {
    return { session: null, fromUrl: false }
  }
  const params = new URLSearchParams(window.location.search)
  const urlShopId = params.get('shopId')?.trim() ?? ''
  const urlTable = params.get('table')?.trim() ?? ''
  if (urlShopId && urlTable) {
    return {
      session: { shopId: urlShopId, tableNumber: urlTable },
      fromUrl: true,
    }
  }
  const cached = readTableSessionFromLocalStorage()
  if (cached.shopId && cached.table) {
    return {
      session: { shopId: cached.shopId, tableNumber: cached.table },
      fromUrl: false,
    }
  }
  return { session: null, fromUrl: false }
}

/**
 * 顾客桌台会话：首屏从 `?shopId=&table=` 或本地缓存恢复，并同步 Zustand + LS。
 * 若来自扫码 URL，会用 `history.replaceState` 去掉 query，保持地址栏干净。
 */
export function useTableSession(enabled = true): TableSession | null {
  const [pack] = useState(() => peekTableSession(enabled))

  useLayoutEffect(() => {
    if (!enabled || !pack.session) return
    const { shopId, tableNumber } = pack.session
    useTableSessionStore.getState().setFromQrParams(shopId, tableNumber)
    if (pack.fromUrl) {
      try {
        const clean = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, clean)
      } catch {
        /* ignore */
      }
    }
  }, [enabled, pack])

  return pack.session
}
