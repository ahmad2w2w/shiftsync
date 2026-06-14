import { cn } from '../../lib/utils'
import type { ReactNode, CSSProperties } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl', className)} style={{ border: '1px solid var(--border)' }}>
      <table className="w-full min-w-[480px] text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
        {children}
      </tr>
    </thead>
  )
}

export function TableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', className)}
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </th>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>{children}</tbody>
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn('transition-colors hover:bg-[var(--surface-hover)]', className)}
      style={{ background: 'var(--surface-card)' }}
    >
      {children}
    </tr>
  )
}

export function TableCell({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <td className={cn('px-4 py-3.5', className)} style={{ color: 'var(--text-secondary)', ...style }}>
      {children}
    </td>
  )
}
