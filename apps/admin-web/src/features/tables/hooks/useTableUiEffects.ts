import { useEffect } from 'react'

type UseTableUiEffectsParams = {
  editTableOpen: boolean
  menuOpenTableId: string | null
  onCloseEdit: () => void
  onCloseMenu: () => void
}

export function useTableUiEffects({
  editTableOpen,
  menuOpenTableId,
  onCloseEdit,
  onCloseMenu,
}: UseTableUiEffectsParams) {
  useEffect(() => {
    if (!editTableOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editTableOpen, onCloseEdit])

  useEffect(() => {
    if (!menuOpenTableId) return
    const onDoc = (event: MouseEvent) => {
      const element = event.target as HTMLElement
      if (element.closest('[data-table-card-menu]')) return
      onCloseMenu()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpenTableId, onCloseMenu])
}

