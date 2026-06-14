import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => false)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    resolver.current?.(result)
    resolver.current = null
    setOptions(null)
  }

  useEffect(() => {
    if (!options) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [options])

  useEffect(() => {
    if (!options || !dialogRef.current) return
    const dialog = dialogRef.current
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    dialog.addEventListener('keydown', trap)
    return () => dialog.removeEventListener('keydown', trap)
  }, [options])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ animation: 'fade-in 0.15s ease-out' }}
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card-md)',
              animation: 'dialog-in 0.18s ease-out',
            }}
          >
            <div className="flex items-start gap-4">
              {options.danger && (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                >
                  <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {options.title}
                </h2>
                {options.message && (
                  <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {options.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button ref={cancelRef} variant="secondary" onClick={() => close(false)}>
                {options.cancelLabel ?? 'Annuleren'}
              </Button>
              <Button variant={options.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
                {options.confirmLabel ?? 'Bevestigen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
