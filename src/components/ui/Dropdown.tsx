import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface DropdownItem {
  id: string
  label: string
  onClick?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
  'aria-label'?: string
}

export function Dropdown({ trigger, items, align = 'left', className, 'aria-label': ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        {trigger}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-xl py-1 shadow-lg animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card-md)' }}
        >
          {items.map((item) => {
            const cls = cn(
              'block w-full px-4 py-2.5 text-left text-sm transition-colors',
              item.disabled && 'opacity-40 cursor-not-allowed',
              item.danger ? 'text-red-500 hover:bg-red-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
            )
            const style = { color: item.danger ? undefined : 'var(--text-primary)' as const }
            if (item.href) {
              return (
                <a key={item.id} href={item.href} role="menuitem" className={cls} style={style} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              )
            }
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cls}
                style={style}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.()
                    setOpen(false)
                  }
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
