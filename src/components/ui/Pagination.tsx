import { ChevronLeft, ChevronRight } from 'lucide-react'

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
    <div className={`flex items-center justify-between gap-3 pt-4 ${className ?? ''}`}>
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
