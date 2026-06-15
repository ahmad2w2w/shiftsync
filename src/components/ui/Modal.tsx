import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl p-4 animate-dialog-in sm:max-h-[90vh] sm:rounded-2xl sm:p-6',
          sizes[size],
          className
        )}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card-md)',
        }}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          {title ? (
            <h2 id="modal-title" className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Sluiten"
            >
              <X className="h-4 w-4" />
            </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
