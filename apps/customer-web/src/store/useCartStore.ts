import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  remark?: string
}

export type CartLine = CartItem

type CartState = {
  items: CartItem[]
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  incrementItem: (id: string, remark?: string) => void
  removeItem: (id: string, remark?: string) => void
  deleteItem: (id: string, remark?: string) => void
  setLineQuantity: (id: string, quantity: number, remark?: string) => void
  clearCart: () => void
}

function sameLine(line: CartItem, id: string, remark?: string): boolean {
  return line.id === id && (line.remark ?? '') === (remark?.trim() ?? '')
}

export const selectTotalQuantity = (state: CartState): number =>
  state.items.reduce((sum, line) => sum + line.quantity, 0)

export const selectTotalPrice = (state: CartState): number =>
  state.items.reduce((sum, line) => sum + line.price * line.quantity, 0)

export const selectCartTotalPrice = selectTotalPrice

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      addItem: (item) => {
        const qty = Math.max(1, item.quantity ?? 1)
        const remark = item.remark?.trim() || undefined
        set((state) => {
          const index = state.items.findIndex((line) =>
            sameLine(line, item.id, remark),
          )
          if (index >= 0) {
            const next = [...state.items]
            next[index] = {
              ...next[index],
              quantity: next[index].quantity + qty,
            }
            return { items: next }
          }
          return {
            items: [
              ...state.items,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: qty,
                remark,
              },
            ],
          }
        })
      },
      incrementItem: (id, remark) =>
        set((state) => ({
          items: state.items.map((line) =>
            sameLine(line, id, remark)
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        })),
      removeItem: (id, remark) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              sameLine(line, id, remark)
                ? { ...line, quantity: line.quantity - 1 }
                : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      deleteItem: (id, remark) =>
        set((state) => ({
          items: state.items.filter((line) => !sameLine(line, id, remark)),
        })),
      setLineQuantity: (id, quantity, remark) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              sameLine(line, id, remark)
                ? { ...line, quantity: Math.max(0, quantity) }
                : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'ejoy_cart_v1',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state?.items?.length) return
        state.items = state.items
          .map((row: CartItem & { productId?: string; unitPrice?: number }) => ({
            id: row.id ?? row.productId ?? '',
            name: row.name,
            price: row.price ?? row.unitPrice ?? 0,
            quantity: Math.max(1, row.quantity),
            remark:
              typeof row.remark === 'string' && row.remark.trim()
                ? row.remark.trim()
                : undefined,
          }))
          .filter((row) => row.id && row.name)
      },
    },
  ),
)

export function useCartTotalPrice(): number {
  return useCartStore(selectTotalPrice)
}

export function useCartTotalQuantity(): number {
  return useCartStore(selectTotalQuantity)
}
