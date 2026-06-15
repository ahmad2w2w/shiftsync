import { cn } from '../../lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevation?: 0 | 1 | 2 | 3
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const elevationVar: Record<number, string> = {
  0: 'none',
  1: 'var(--shadow-1)',
  2: 'var(--shadow-2)',
  3: 'var(--shadow-3)',
}

const paddingClass = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  className,
  children,
  style,
  elevation = 1,
  interactive,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        paddingClass[padding],
        interactive && 'press hover-lift cursor-pointer transition-shadow hover:shadow-[var(--shadow-3)]',
        className
      )}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        boxShadow: elevationVar[elevation],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
