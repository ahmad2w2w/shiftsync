import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
})

let counter = 0

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  error:   { icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  info:    { icon: Info,         color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const { icon: Icon, color, bg } = VARIANT_STYLES[toast.variant]

  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onClose])

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card-md)',
        animation: 'toast-in 0.2s ease-out',
      }}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: bg }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </span>
      <p className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 rounded-md p-0.5 transition-colors hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Sluiten"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++counter
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const success = useCallback((m: string) => toast(m, 'success'), [toast])
  const error = useCallback((m: string) => toast(m, 'error'), [toast])
  const info = useCallback((m: string) => toast(m, 'info'), [toast])
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast])

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, info, warning }),
    [toast, success, error, info, warning]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
