import { useToastStore } from '../store/useToastStore'

export function ToastViewport() {
  const message = useToastStore((s) => s.message)
  const variant = useToastStore((s) => s.variant)
  const hide = useToastStore((s) => s.hide)

  if (!message) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 96,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: 'min(92vw, 360px)',
        padding: '12px 18px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        background:
          variant === 'success' ? '#0f766e' : variant === 'info' ? '#1e3a5f' : '#b91c1c',
        color: '#fff',
        cursor: 'pointer',
      }}
      onClick={() => hide()}
    >
      {message}
    </div>
  )
}
