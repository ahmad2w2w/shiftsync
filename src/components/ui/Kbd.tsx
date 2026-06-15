import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1.5 text-[10px] font-semibold',
        className
      )}
      style={{
        background: 'var(--surface-subtle)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 0 var(--border)',
      }}
    >
      {children}
    </kbd>
  )
}
