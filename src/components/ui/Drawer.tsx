import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  width?: 'md' | 'lg' | 'xl'
}

const widths = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Drawer({ open, onClose, title, subtitle, children, className, width = 'xl' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        className={cn('relative flex h-full w-full flex-col animate-slide-in-right shadow-2xl', widths[width], className)}
        style={{
          background: 'var(--surface-card)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: 'var(--border)' }}>
          <div>
            {title && <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-black/5" style={{ color: 'var(--text-muted)' }} aria-label="Sluiten">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
