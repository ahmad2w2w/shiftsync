import { ChevronLeft, ChevronRight } from 'lucide-react'
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

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

/** Compact pager for tables/lists. Pages are 0-indexed. */
export function Pagination({ page, pageCount, total, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <div className={cn('flex items-center justify-between gap-3 pt-4', className)}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Pagina {page + 1} van {pageCount} · {total} items
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="press inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          aria-label="Vorige pagina"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
          disabled={page >= pageCount - 1}
          className="press inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          aria-label="Volgende pagina"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
