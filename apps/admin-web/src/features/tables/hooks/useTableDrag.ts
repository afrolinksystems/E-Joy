import { useEffect, useRef } from 'react'
import type { TableDragState, TablePosition } from '../tables.types'
import { snap01 } from '../tables.utils'

type UseTableDragParams = {
  draggingId: string | null
  floorRef: React.RefObject<HTMLDivElement | null>
  setDraggingId: (id: string | null) => void
  setLocalPositions: React.Dispatch<React.SetStateAction<Record<string, TablePosition>>>
}

export function useTableDrag({
  draggingId,
  floorRef,
  setDraggingId,
  setLocalPositions,
}: UseTableDragParams) {
  const dragRef = useRef<TableDragState | null>(null)

  useEffect(() => {
    if (!draggingId || !dragRef.current) return

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current
      const floor = floorRef.current
      if (!drag || !floor) return

      const rect = floor.getBoundingClientRect()
      const dx = (event.clientX - drag.startClientX) / rect.width
      const dy = (event.clientY - drag.startClientY) / rect.height
      const posX = snap01(drag.originX + dx)
      const posY = snap01(drag.originY + dy)
      setLocalPositions((prev) => ({
        ...prev,
        [drag.id]: { posX, posY },
      }))
    }

    const onUp = () => {
      setDraggingId(null)
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { capture: true })
    window.addEventListener('pointercancel', onUp, { capture: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp, { capture: true })
      window.removeEventListener('pointercancel', onUp, { capture: true })
    }
  }, [draggingId, floorRef, setDraggingId, setLocalPositions])

  return dragRef
}

