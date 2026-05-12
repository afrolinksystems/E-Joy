import { create } from 'zustand'

type ToastVariant = 'success' | 'error' | 'info'

type ToastState = {
  message: string | null
  variant: ToastVariant
  show: (message: string, variant?: ToastVariant) => void
  hide: () => void
}

let hideTimer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'success',
  show: (message, variant = 'success') => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message, variant })
    hideTimer = setTimeout(() => {
      set({ message: null })
      hideTimer = undefined
    }, 4500)
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = undefined
    set({ message: null })
  },
}))
